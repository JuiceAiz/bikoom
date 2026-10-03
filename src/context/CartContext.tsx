import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../../shared/types";

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
  count: number;
  /** Sum of displayed prices (items with showPrice and a price). */
  pricedTotal: number;
  /** Items whose price is hidden — shown as "Contact for Price". */
  hasContactForPrice: boolean;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "bikoom.cart.v1";
const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.id === "string" &&
        typeof item?.name === "string" &&
        typeof item?.quantity === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full / private mode — cart still works in memory
    }
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
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
