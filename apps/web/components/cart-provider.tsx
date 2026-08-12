"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { api } from "@/lib/api";
import { Cart, Session } from "@/lib/types";

interface CartContextValue {
  cart: Cart | null;
  session: Session | null;
  isDrawerOpen: boolean;
  setDrawerOpen: (value: boolean) => void;
  login: (session: Session) => void;
  logout: () => void;
  refreshCart: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  updateItem: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}
const CartContext = createContext<CartContextValue | null>(null);
const SESSION_KEY = "cartcraft.session.v1";
const SESSION_EVENT = "cartcraft:session-change";

let cachedSessionValue: string | null | undefined;
let cachedSession: Session | null = null;

function getClientSession() {
  const value = localStorage.getItem(SESSION_KEY);
  if (value === cachedSessionValue) return cachedSession;

  cachedSessionValue = value;
  try {
    cachedSession = value ? (JSON.parse(value) as Session) : null;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

function getServerSession() {
  return null;
}

function subscribeToSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SESSION_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SESSION_EVENT, onStoreChange);
  };
}

function persistSession(next: Session | null) {
  if (next) {
    const value = JSON.stringify(next);
    cachedSessionValue = value;
    cachedSession = next;
    localStorage.setItem(SESSION_KEY, value);
  } else {
    cachedSessionValue = null;
    cachedSession = null;
    localStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(
    subscribeToSession,
    getClientSession,
    getServerSession,
  );
  const [cart, setCart] = useState<Cart | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const refreshCart = useCallback(async () => {
    if (!session) {
      setCart(null);
      return;
    }
    setCart(await api.cart(session.accessToken));
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const { accessToken } = session;
    let cancelled = false;
    async function loadCart() {
      try {
        const nextCart = await api.cart(accessToken);
        if (!cancelled) setCart(nextCart);
      } catch {
        if (!cancelled) {
          setCart(null);
          persistSession(null);
        }
      }
    }
    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const login = useCallback((next: Session) => {
    setCart(null);
    persistSession(next);
  }, []);
  const logout = useCallback(() => {
    persistSession(null);
    setCart(null);
    setDrawerOpen(false);
  }, []);
  const addItem = useCallback(
    async (productId: string) => {
      if (!session) throw new Error("Сначала войдите в аккаунт");
      const next = await api.addToCart(session.accessToken, productId);
      setCart(next);
      setDrawerOpen(true);
    },
    [session],
  );
  const updateItem = useCallback(
    async (id: string, quantity: number) => {
      if (!session) return;
      setCart(await api.updateCart(session.accessToken, id, quantity));
    },
    [session],
  );
  const removeItem = useCallback(
    async (id: string) => {
      if (!session) return;
      setCart(await api.removeCart(session.accessToken, id));
    },
    [session],
  );
  const value = useMemo(
    () => ({
      cart: session ? cart : null,
      session,
      isDrawerOpen,
      setDrawerOpen,
      login,
      logout,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
    }),
    [
      cart,
      session,
      isDrawerOpen,
      login,
      logout,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
    ],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
