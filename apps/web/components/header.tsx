"use client";
import Link from "next/link";
import { CircleUserRound, Search, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";
import { CartDrawer } from "./cart-drawer";
export function Header() {
  const { cart, session, setDrawerOpen } = useCart();
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            CartCraft
          </Link>
          <nav className="nav">
            <Link href="/#catalog">Каталог</Link>
            <Link href="/#catalog">Категории</Link>
            <Link href="/#about">О нас</Link>
          </nav>
          <div className="header-actions">
            <label aria-label="Поиск" className="search">
              <Search size={17} />
              <input
                placeholder="Поиск по товарам"
                aria-label="Поиск по товарам"
              />
            </label>
            <Link
              className="icon-button"
              href={
                session
                  ? session.user.role === "ADMIN"
                    ? "/admin"
                    : "/account"
                  : "/login"
              }
              aria-label="Личный кабинет"
            >
              <CircleUserRound size={22} />
            </Link>
            <button
              className="icon-button"
              aria-label="Открыть корзину"
              onClick={() => setDrawerOpen(true)}
            >
              <ShoppingBag size={22} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
