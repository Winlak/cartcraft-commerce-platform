"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Product } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { Header } from "@/components/header";
import { useCart } from "@/components/cart-provider";
export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const { addItem } = useCart();
  useEffect(() => {
    void api
      .product(params.slug)
      .then(setProduct)
      .catch(() => setError("Товар не найден или временно недоступен."));
  }, [params.slug]);
  async function add() {
    if (!product) return;
    try {
      await addItem(product.id);
    } catch {
      window.location.href = `/login?next=/products/${product.slug}`;
    }
  }
  return (
    <>
      <Header />
      <main className="container product-page">
        <Link href="/#catalog" className="back-link">
          <ArrowLeft size={17} /> Каталог
        </Link>
        {error ? (
          <div className="alert">{error}</div>
        ) : !product ? (
          <div className="empty">Загрузка товара…</div>
        ) : (
          <div className="product-detail">
            <div className="product-detail-image">
            <Image src={product.imageUrl} alt={product.name} width={900} height={1024} priority />
            </div>
            <div className="product-detail-copy">
              <p className="product-category">{product.category.name}</p>
              <h1>{product.name}</h1>
              <p className="detail-price">{formatMoney(product.price)}</p>
              <p className="detail-description">{product.description}</p>
              <p className={product.stock < 4 ? "stock low" : "stock"}>
                {product.stock
                  ? product.stock < 4
                    ? `Осталось ${product.stock} шт.`
                    : "В наличии"
                  : "Нет в наличии"}
              </p>
              <button
                className="button"
                disabled={!product.stock}
                onClick={() => void add()}
              >
                <ShoppingBag size={17} /> Добавить в корзину
              </button>
              <dl>
                <div>
                  <dt>Артикул</dt>
                  <dd>{product.sku}</dd>
                </div>
                <div>
                  <dt>Доставка</dt>
                  <dd>1–4 рабочих дня</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
