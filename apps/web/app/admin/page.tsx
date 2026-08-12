"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { api } from "@/lib/api";
import { Order, Product } from "@/lib/types";
import { formatMoney, statusLabel } from "@/lib/format";
export default function AdminPage() {
  const router = useRouter();
  const { session, logout } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<
    (Order & { user: { email: string; firstName: string; lastName: string } })[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) {
      router.replace("/login?next=/admin");
      return;
    }
    if (session.user.role !== "ADMIN") {
      router.replace("/account");
      return;
    }
    void Promise.all([
      api.adminProducts(session.accessToken),
      api.adminOrders(session.accessToken),
    ])
      .then(([nextProducts, nextOrders]) => {
        setProducts(nextProducts);
        setOrders(nextOrders);
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось загрузить управление магазином",
        ),
      );
  }, [session, router]);
  async function setStock(product: Product, stock: number) {
    if (!session || Number.isNaN(stock) || stock < 0) return;
    try {
      const next = await api.setStock(session.accessToken, product.id, stock);
      setProducts((items) =>
        items.map((item) => (item.id === next.id ? next : item)),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось обновить остаток",
      );
    }
  }
  async function nextStatus(order: (typeof orders)[number]) {
    if (!session) return;
    const path: Record<string, string | undefined> = {
      PAID: "PROCESSING",
      PROCESSING: "SHIPPED",
      SHIPPED: "DELIVERED",
    };
    const status = path[order.status];
    if (!status) return;
    try {
      const next = await api.setOrderStatus(
        session.accessToken,
        order.id,
        status,
      );
      setOrders((items) =>
        items.map((item) =>
          item.id === next.id ? { ...item, ...next } : item,
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Статус не обновлён");
    }
  }
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/" className="brand">
          CartCraft
        </Link>
        <nav>
          <a href="#overview">
            <LayoutDashboard size={18} /> Обзор
          </a>
          <a className="active" href="#products">
            <PackageSearch size={18} /> Товары
          </a>
          <a href="#orders">
            <ShoppingBag size={18} /> Заказы
          </a>
          <a href="#customers">
            <UsersRound size={18} /> Клиенты
          </a>
        </nav>
        <button
          className="admin-logout"
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          Выйти
        </button>
      </aside>
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1>Товары и остатки</h1>
            <p>Управляйте каталогом и следите за новыми заказами.</p>
          </div>
          <a
            className="button"
            href="http://localhost:4000/api/docs"
            target="_blank"
          >
            OpenAPI
          </a>
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="admin-grid">
          <section className="table-wrap" id="products">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Артикул</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product">
                        <Image src={product.imageUrl} alt="" width={45} height={55} />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>{product.sku}</td>
                    <td>{formatMoney(product.price)}</td>
                    <td>
                      <input
                        className="stock-input"
                        aria-label={`Остаток ${product.name}`}
                        type="number"
                        min="0"
                        defaultValue={product.stock}
                        onBlur={(event) =>
                          void setStock(product, Number(event.target.value))
                        }
                      />
                    </td>
                    <td>
                      <span
                        className={
                          product.stock < 4
                            ? "status PENDING_PAYMENT"
                            : "status PAID"
                        }
                      >
                        {product.stock
                          ? product.stock < 4
                            ? "Мало осталось"
                            : "В наличии"
                          : "Нет в наличии"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <aside className="admin-orders" id="orders">
            <h2>Новые заказы</h2>
            {orders.slice(0, 5).map((order) => (
              <article className="admin-order" key={order.id}>
                <div className="admin-order-top">
                  <strong>{order.number}</strong>
                  <strong>{formatMoney(order.total)}</strong>
                </div>
                <p>
                  {order.user.firstName} {order.user.lastName}
                </p>
                <button
                  className={`status ${order.status}`}
                  onClick={() => void nextStatus(order)}
                >
                  {statusLabel[order.status] ?? order.status}
                </button>
              </article>
            ))}
            {!orders.length && (
              <div className="empty">Новых заказов пока нет.</div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
