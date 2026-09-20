import { useSyncExternalStore, useCallback } from "react";

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  mrp: number | null;
  qty: number;
}

const KEY = "vh_accessory_cart";
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: CartItem[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export const SHIPPING_FEE = 0;
export const FREE_SHIPPING_ABOVE = 999;
export const STANDARD_SHIPPING = 79;

export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const mrpTotal = items.reduce((s, i) => s + (i.mrp && i.mrp > i.price ? i.mrp : i.price) * i.qty, 0);
  const savings = Math.max(0, mrpTotal - subtotal);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : STANDARD_SHIPPING;
  return { subtotal, savings, shipping, total: subtotal + shipping };
}

export function useAccessoryCart() {
  const items = useSyncExternalStore(subscribe, read, () => [] as CartItem[]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    const current = read();
    const found = current.find((i) => i.id === item.id);
    write(
      found
        ? current.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i))
        : [...current, { ...item, qty }]
    );
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const current = read();
    write(qty <= 0 ? current.filter((i) => i.id !== id) : current.map((i) => (i.id === id ? { ...i, qty } : i)));
  }, []);

  const remove = useCallback((id: string) => write(read().filter((i) => i.id !== id)), []);
  const clear = useCallback(() => write([]), []);

  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    totals: cartTotals(items),
    add,
    setQty,
    remove,
    clear,
  };
}
