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
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

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
  // the stored cart with the empty initial state).
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items]);

  const add = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
            : item,
        );
      }
      const price =
        product.show_price && product.price != null ? Number(product.price) : null;
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price,
          showPrice: product.show_price,
          imageUrl: product.image_url ?? null,
          quantity: Math.min(99, Math.max(1, quantity)),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity < 1
        ? prev.filter((item) => item.id !== id)
        : prev.map((item) =>
            item.id === id ? { ...item, quantity: Math.min(99, quantity) } : item,
          ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

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
