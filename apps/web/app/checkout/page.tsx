"use client";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { useCart } from "@/components/cart-provider";
import { api } from "@/lib/api";
import { Address } from "@/lib/types";
import { formatMoney } from "@/lib/format";
export default function CheckoutPage() {
  const router = useRouter();
  const { session, cart, refreshCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  useEffect(() => {
    if (!session) {
      router.replace("/login?next=/checkout");
      return;
    }
    void api
      .addresses(session.accessToken)
      .then((next) => {
        setAddresses(next);
        setSelected(
          next.find((address) => address.isDefault)?.id ?? next[0]?.id ?? "",
        );
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Не удалось загрузить адреса",
        ),
      );
  }, [session, router]);
  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const data = new FormData(event.currentTarget);
    try {
      const created = await api.createAddress(session.accessToken, {
        recipient: String(data.get("recipient")),
        phone: String(data.get("phone")),
        city: String(data.get("city")),
        street: String(data.get("street")),
        postalCode: String(data.get("postalCode")),
        isDefault: addresses.length === 0,
      });
      setAddresses((items) => [created, ...items]);
      setSelected(created.id);
      setShowAddressForm(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось добавить адрес",
      );
    }
  }
  async function checkout() {
    if (!session || !selected) return;
    setBusy(true);
    setError("");
    try {
      const order = await api.checkout(
        session.accessToken,
        selected,
        crypto.randomUUID(),
      );
      await api.intent(session.accessToken, order.id);
      await api.mockPay(session.accessToken, order.id);
      await refreshCart();
      router.push(`/account?order=${order.number}`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось оформить заказ",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="checkout-page container">
        <div className="two-column">
          <section>
            <h1>Оформление заказа</h1>
            <div className="field-card">
              <h2>Адрес доставки</h2>
              {addresses.map((address) => (
                <label
                  className={`address-option ${selected === address.id ? "selected" : ""}`}
                  key={address.id}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selected === address.id}
                    onChange={() => setSelected(address.id)}
                  />
                  <span>
                    <strong>{address.recipient}</strong>
                    <p>
                      {address.street}, {address.city}, {address.postalCode}
                      <br />
                      {address.phone}
                    </p>
                  </span>
                </label>
              ))}
              {showAddressForm ? (
                <form
                  onSubmit={(event) => void createAddress(event)}
                  className="address-form"
                >
                  <div className="name-grid">
                    <div className="form-field">
                      <label>Получатель</label>
                      <input name="recipient" required />
                    </div>
                    <div className="form-field">
                      <label>Телефон</label>
                      <input name="phone" placeholder="+79991234567" required />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Город</label>
                    <input name="city" required />
                  </div>
                  <div className="form-field">
                    <label>Улица, дом, квартира</label>
                    <input name="street" required />
                  </div>
                  <div className="form-field">
                    <label>Индекс</label>
                    <input name="postalCode" required />
                  </div>
                  <button className="button">Сохранить адрес</button>
                </form>
              ) : (
                <button
                  className="add-address"
                  onClick={() => setShowAddressForm(true)}
                >
                  + Добавить другой адрес
                </button>
              )}
            </div>
            <div className="field-card">
              <h2>Способ доставки</h2>
              <label className="address-option selected">
                <input type="radio" defaultChecked name="delivery" />
                <span>
                  <strong>Курьером по Москве</strong>
                  <p>1–2 дня · 490 ₽</p>
                </span>
              </label>
              <label className="address-option">
                <input type="radio" name="delivery" />
                <span>
                  <strong>Пункт выдачи</strong>
                  <p>2–4 дня · 290 ₽</p>
                </span>
              </label>
            </div>
            <div className="field-card">
              <h2>Оплата</h2>
              <label className="address-option selected">
                <input type="radio" defaultChecked name="payment" />
                <span>
                  <strong>Банковская карта</strong>
                  <p>Безопасная демо-оплата через local mock provider.</p>
                </span>
              </label>
            </div>
            {error && <div className="alert">{error}</div>}
          </section>
          <aside className="order-summary">
            <h2>Ваш заказ</h2>
            {cart?.items.map((item) => (
              <div className="order-summary-item" key={item.id}>
                <Image
                  src={item.product.imageUrl}
                  alt=""
                  width={62}
                  height={76}
                />
                <div>
                  <h3>{item.product.name}</h3>
                  <p>
                    {item.quantity} × {formatMoney(item.product.price)}
                  </p>
                </div>
              </div>
            ))}
            <div className="summary-row" style={{ marginTop: 17 }}>
              <span>Товары</span>
              <span>{formatMoney(cart?.total ?? 0)}</span>
            </div>
            <div className="summary-row" style={{ marginTop: 10 }}>
              <span>Доставка</span>
              <span>490 ₽</span>
            </div>
            <div className="summary-row" style={{ marginTop: 18 }}>
              <strong>Итого</strong>
              <strong>{formatMoney((cart?.total ?? 0) + 490)}</strong>
            </div>
            <button
              className="button"
              style={{ width: "100%", marginTop: 20 }}
              disabled={!cart?.items.length || !selected || busy}
              onClick={() => void checkout()}
            >
              {busy ? "Оформляем…" : "Подтвердить заказ"}
            </button>
          </aside>
        </div>
      </main>
    </>
  );
}
