"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { useCart } from "@/components/cart-provider";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { formatMoney, statusLabel } from "@/lib/format";
function AccountContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { session, logout } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) {
      router.replace("/login?next=/account");
      return;
    }
    void api
      .orders(session.accessToken)
      .then(setOrders)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось загрузить заказы",
        ),
      );
  }, [session, router]);
  return (
    <>
      <Header />
      <main className="account-page container">
        <div className="account-layout">
          <aside className="account-nav">
            <Link href="/account" className="active">
              Мои заказы
            </Link>
            <a href="#addresses">Адреса</a>
            {session?.user.role === "ADMIN" && (
              <Link href="/admin">Управление магазином</Link>
            )}
            <button
              className="text-button"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Выйти
            </button>
          </aside>
          <section>
            <h1>Мои заказы</h1>
            {params.get("order") && (
              <div className="success-message">
                Заказ {params.get("order")} создан. Откройте API документацию,
                чтобы отправить демонстрационный подписанный webhook оплаты.
              </div>
            )}
            {error ? (
              <div className="alert">{error}</div>
            ) : orders.length ? (
              <div className="order-list">
                {orders.map((order) => (
                  <article className="order-row" key={order.id}>
                    <div>
                      <strong>{order.number}</strong>
                      <p className="order-date">
                        {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                    <span>{order.items.length} поз.</span>
                    <strong>{formatMoney(order.total)}</strong>
                    <span className={`status ${order.status}`}>
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty field-card">
                У вас пока нет заказов.{" "}
                <Link className="text-link" href="/#catalog">
                  Перейти к каталогу
                </Link>
              </div>
            )}
            <section id="addresses" className="address-section">
              <h2>Адреса</h2>
              <p>
                Адрес для следующего заказа можно выбрать и добавить на странице
                оформления.
              </p>
            </section>
          </section>
        </div>
      </main>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="empty">Загрузка кабинета…</div>}>
      <AccountContent />
    </Suspense>
  );
}
