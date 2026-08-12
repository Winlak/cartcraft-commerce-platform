import { Suspense } from "react";
import { Header } from "@/components/header";
import { AuthForm } from "@/components/auth-form";
export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="empty">Загрузка…</div>}>
        <AuthForm mode="login" />
      </Suspense>
    </>
  );
}
