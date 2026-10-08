import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../../../shared/types";
import { useRealtimeVersion } from "../lib/realtime";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  showPrice: boolean;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  /** False until the persisted cart has been read from storage. */
  ready: boolean;
  count: number;
  pricedTotal: number;
  hasContactForPrice: boolean;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "bikoom.cart.v1";
const CART_TABLES = ["cart_items"] as const;
const CartContext = createContext<CartContextValue | null>(null);

/**
 * Supabase query builders are lazy thenables — the request only goes
 * out once then()/catch() is called, so a plain `void builder` would
 * silently never execute. `fire` starts the request; cart sync is
 * best-effort so failures are ignored (a later mutation or realtime
 * event heals the cart).
 */
function fire(request: PromiseLike<unknown>): void {
  request.then(
    () => undefined,
    () => undefined,
  );
}

/** A public.cart_items row as returned by PostgREST. */
interface CartRow {
  user_id: string;
  product_id: string;
  slug: string;
  name: string;
  price: number | string | null;
  show_price: boolean;
  image_url: string | null;
  quantity: number;
}

function rowToItem(row: CartRow): CartItem {
  return {
    id: row.product_id,
    slug: row.slug,
    name: row.name,
    price: row.price === null ? null : Number(row.price),
    showPrice: row.show_price,
    imageUrl: row.image_url,
    quantity: row.quantity,
  };
}

function itemToRow(userId: string, item: CartItem): CartRow {
  return {
    user_id: userId,
    product_id: item.id,
    slug: item.slug,
    name: item.name,
    price: item.price,
    show_price: item.showPrice,
    image_url: item.imageUrl,
    quantity: item.quantity,
  };
}

/**
 * Union of the device cart and the account cart: every item from both
 * sides, taking the larger quantity when an item appears on both.
 * Server snapshots win for name/price (they are the freshest).
 */
function mergeCart(local: CartItem[], server: CartItem[]): CartItem[] {
  const byId = new Map<string, CartItem>();
  for (const item of server) byId.set(item.id, item);
  for (const item of local) {
    const existing = byId.get(item.id);
    byId.set(
      item.id,
      existing
        ? {
            ...existing,
            quantity: Math.min(99, Math.max(existing.quantity, item.quantity)),
          }
        : item,
    );
  }
  return [...byId.values()];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Read the persisted cart once on mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(
              parsed.filter(
                (item): item is CartItem =>
                  typeof item?.id === "string" &&
                  typeof item?.name === "string" &&
                  typeof item?.quantity === "number",
              ),
            );
          }
        } catch {
          // corrupt payload — start with an empty cart
        }
      })
      .finally(() => {
        if (cancelled) return;
        hydrated.current = true;
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist changes (only after the initial read, so we never wipe
  // the stored cart with the empty initial state). Also serves as the
  // offline cache for signed-in carts.
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items]);

  // ---------------------------------------------------------------
  // Server sync for signed-in customers (public.cart_items).
  // Sync is best-effort: on network failure the local cart still
  // works and the next successful mutation/realtime event heals it.
  // ---------------------------------------------------------------
  const upsertRemote = useCallback((rows: CartItem[]) => {
    if (!userId || rows.length === 0) return;
    for (const item of rows) {
      fire(supabase.from("cart_items").upsert(itemToRow(userId, item)));
    }
  }, [userId]);

  const deleteRemote = useCallback(
    (productId: string) => {
      if (!userId) return;
      fire(
        supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId),
      );
    },
    [userId],
  );

  const clearRemote = useCallback(() => {
    if (!userId) return;
    fire(supabase.from("cart_items").delete().eq("user_id", userId));
  }, [userId]);

  // On sign-in, merge the device cart into the account cart and push
  // the result — this is what makes the same account show the same
  // cart on the website and in the app. Waits for local hydration so
  // the stored device cart is part of the merge.
  useEffect(() => {
    if (!ready || !userId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId);
      if (cancelled || error || !data) return;
      const server = (data as CartRow[]).map(rowToItem);
      const merged = mergeCart(itemsRef.current, server);
      if (cancelled) return;
      setItems(merged);
      upsertRemote(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, userId, upsertRemote]);

  // Live updates from the other device (or an admin removing a
  // product): reload the account cart whenever cart_items changes.
  const version = useRealtimeVersion(CART_TABLES);
  useEffect(() => {
    if (version === 0 || !ready || !userId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId);
      if (cancelled || error || !data) return;
      setItems((data as CartRow[]).map(rowToItem));
    })();
    return () => {
      cancelled = true;
    };
  }, [version, ready, userId]);

  const add = useCallback(
    (product: Product, quantity = 1) => {
      const prev = itemsRef.current;
      const existing = prev.find((item) => item.id === product.id);
      let next: CartItem;
      if (existing) {
        next = { ...existing, quantity: Math.min(99, existing.quantity + quantity) };
      } else {
        const price =
          product.show_price && product.price != null ? Number(product.price) : null;
        next = {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price,
          showPrice: product.show_price,
          imageUrl: product.image_url ?? null,
          quantity: Math.min(99, Math.max(1, quantity)),
        };
      }
      setItems([...prev.filter((item) => item.id !== product.id), next]);
      upsertRemote([next]);
    },
    [upsertRemote],
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      const prev = itemsRef.current;
      if (quantity < 1) {
        setItems(prev.filter((item) => item.id !== id));
        deleteRemote(id);
        return;
      }
      const clamped = Math.min(99, quantity);
      setItems(
        prev.map((item) => (item.id === id ? { ...item, quantity: clamped } : item)),
      );
      const target = prev.find((item) => item.id === id);
      if (target) upsertRemote([{ ...target, quantity: clamped }]);
    },
    [upsertRemote, deleteRemote],
  );

  const remove = useCallback(
    (id: string) => {
      setItems(itemsRef.current.filter((item) => item.id !== id));
      deleteRemote(id);
    },
    [deleteRemote],
  );

  const clear = useCallback(() => {
    setItems([]);
    clearRemote();
  }, [clearRemote]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const pricedTotal = items.reduce(
      (sum, item) =>
        item.showPrice && item.price !== null
          ? sum + item.price * item.quantity
          : sum,
      0,
    );
    return {
      items,
      ready,
      count,
      pricedTotal,
      hasContactForPrice: items.some(
        (item) => !item.showPrice || item.price === null,
      ),
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [items, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
