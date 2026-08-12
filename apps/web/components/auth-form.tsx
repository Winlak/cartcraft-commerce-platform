"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useCart } from "./cart-provider";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useCart();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      const session =
        mode === "login"
          ? await api.login(
              String(data.get("email")),
              String(data.get("password")),
            )
          : await api.register({
              email: String(data.get("email")),
              password: String(data.get("password")),
              firstName: String(data.get("firstName")),
              lastName: String(data.get("lastName")),
            });
      login(session);
      router.replace(
        params.get("next") ??
          (session.user.role === "ADMIN" ? "/admin" : "/account"),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  }
  const isLogin = mode === "login";
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>{isLogin ? "С возвращением" : "Создать аккаунт"}</h1>
        <p>
          {isLogin
            ? "Войдите, чтобы продолжить покупки и увидеть историю заказов."
            : "Один аккаунт для каталога, заказа и личного кабинета."}
        </p>
        <form onSubmit={(event) => void submit(event)}>
          {!isLogin && (
            <div className="name-grid">
              <div className="form-field">
                <label htmlFor="firstName">Имя</label>
                <input id="firstName" name="firstName" required />
              </div>
              <div className="form-field">
                <label htmlFor="lastName">Фамилия</label>
                <input id="lastName" name="lastName" required />
              </div>
            </div>
          )}
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={
                isLogin ? undefined : "Не менее 8 символов, буква и цифра"
              }
            />
          </div>
          {error && <div className="alert">{error}</div>}
          <button className="button form-submit" disabled={busy}>
            {busy ? "Подождите…" : isLogin ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
        <p className="auth-switch">
          {isLogin ? "Впервые в CartCraft?" : "Уже есть аккаунт?"}{" "}
          <Link className="text-link" href={isLogin ? "/register" : "/login"}>
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </Link>
        </p>
        <p className="demo-note">Демо: user@cartcraft.local / DemoPass123!</p>
      </section>
    </main>
  );
}
