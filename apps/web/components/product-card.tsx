"use client";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Product } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { useCart } from "./cart-provider";
export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  async function add() {
    try {
      await addItem(product.id);
    } catch {
      window.location.href = `/login?next=/products/${product.slug}`;
    }
  }
  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-image">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 900px) 50vw, 25vw"
        />
      </Link>
      <div className="product-info">
        <p className="product-category">{product.category.name}</p>
        <Link href={`/products/${product.slug}`} className="product-title">
          {product.name}
        </Link>
        <div className="price-row">
          <span>{formatMoney(product.price)}</span>
          <button
            className="add-small"
            disabled={!product.stock}
            onClick={() => void add()}
            aria-label={`Добавить ${product.name} в корзину`}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
        {!product.stock && (
          <p
            className="product-category"
            style={{ color: "#a0462d", marginBottom: 0 }}
          >
            Нет в наличии
          </p>
        )}
      </div>
    </article>
  );
}
