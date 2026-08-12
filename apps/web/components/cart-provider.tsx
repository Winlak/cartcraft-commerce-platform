"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import { Cart, Session } from "@/lib/types";

interface CartContextValue {
  cart: Cart | null;
  session: Session | null;
  loading: boolean;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const refreshCart = useCallback(async () => {
    if (!session) {
      setCart(null);
      return;
    }
    setCart(await api.cart(session.accessToken));
  }, [session]);
  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) setSession(JSON.parse(raw) as Session);
    setLoading(false);
  }, []);
  useEffect(() => {
    if (session)
      void refreshCart().catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      });
  }, [session, refreshCart]);
  const login = useCallback((next: Session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
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
      cart,
      session,
      loading,
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
      loading,
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
