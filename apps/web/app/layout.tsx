import type { Metadata } from "next";
import { CartProvider } from "@/components/cart-provider";
import "./globals.css";
import "./extras.css";

export const metadata: Metadata = {
  title: "CartCraft — предметы для дома и работы",
  description: "Каталог и обработка заказов CartCraft",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
