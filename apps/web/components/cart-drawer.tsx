"use client";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "./cart-provider";
export function CartDrawer() {
  const { cart, isDrawerOpen, setDrawerOpen, updateItem, removeItem, session } =
    useCart();
  if (!isDrawerOpen) return null;
  return (
    <>
      <button
        className="drawer-backdrop"
        aria-label="Закрыть корзину"
        onClick={() => setDrawerOpen(false)}
      />
      <aside className="cart-drawer" aria-label="Корзина">
        <div className="drawer-head">
          <h2>Корзина ({cart?.items.length ?? 0})</h2>
          <button
            className="icon-button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Закрыть"
          >
            <X />
          </button>
        </div>
        <div className="cart-items">
          {cart?.items.length ? (
            cart.items.map((item) => (
              <article className="cart-item" key={item.id}>
                <Image src={item.product.imageUrl} alt="" width={80} height={94} />
                <div>
                  <h3>{item.product.name}</h3>
                  <p>{formatMoney(item.product.price)}</p>
                  <div className="quantity">
                    <button
                      onClick={() =>
                        void updateItem(item.id, item.quantity - 1)
                      }
                      disabled={item.quantity === 1}
                      aria-label="Уменьшить"
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        void updateItem(item.id, item.quantity + 1)
                      }
                      aria-label="Увеличить"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button
                  className="icon-button"
                  onClick={() => void removeItem(item.id)}
                  aria-label="Удалить"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))
          ) : (
            <div className="empty">Корзина пока пуста.</div>
          )}
        </div>
        {cart?.items.length ? (
          <div className="summary">
            <div className="summary-row">
              <strong>Итого</strong>
              <strong>{formatMoney(cart.total)}</strong>
            </div>
            {session ? (
              <Link
                className="button"
                href="/checkout"
                onClick={() => setDrawerOpen(false)}
                style={{ display: "block", textAlign: "center", marginTop: 18 }}
              >
                Оформить заказ
              </Link>
            ) : (
              <Link
                className="button"
                href="/login"
                onClick={() => setDrawerOpen(false)}
                style={{ display: "block", textAlign: "center", marginTop: 18 }}
              >
                Войти для оформления
              </Link>
            )}
          </div>
        ) : null}
      </aside>
    </>
  );
}
