"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { Category, Product } from "@/lib/types";
import { Header } from "./header";
import { ProductCard } from "./product-card";
export function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    void api
      .categories()
      .then(setCategories)
      .catch(() =>
        setError(
          "Не удалось загрузить категории. Запустите API и попробуйте ещё раз.",
        ),
      );
  }, []);
  useEffect(() => {
    const search = new URLSearchParams();
    if (selected) search.set("category", selected);
    if (query) search.set("q", query);
    void api
      .products(search.toString())
      .then((result) => {
        setProducts(result.items);
        setError("");
      })
      .catch(() => setError("Не удалось загрузить каталог."));
  }, [selected, query]);
  const title = useMemo(
    () =>
      selected
        ? (categories.find((category) => category.slug === selected)?.name ??
          "Каталог")
        : "Популярное",
    [categories, selected],
  );
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>Вещи, которые хочется оставить</h1>
            <p>
              Продуманные предметы для дома и работы, созданные из качественных
              материалов и с вниманием к деталям.
            </p>
            <a className="button" href="#catalog">
              Смотреть каталог
            </a>
          </div>
          <div className="hero-media">
            <Image
              src="/products/dome-lamp.png"
              alt="Настольная лампа CartCraft"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
        </section>
        <section className="section container" id="catalog">
          <div className="section-heading">
            <h2>{title}</h2>
            <div className="filters">
              <button
                className={`filter ${!selected ? "active" : ""}`}
                onClick={() => setSelected("")}
              >
                Все
              </button>
              {categories.map((category) => (
                <button
                  className={`filter ${selected === category.slug ? "active" : ""}`}
                  key={category.id}
                  onClick={() => setSelected(category.slug)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          <div className="catalog-tools">
            <label>
              <SlidersHorizontal size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти предмет"
                aria-label="Найти предмет"
              />
            </label>
            <span>{products.length} предметов</span>
          </div>
          {error ? (
            <div className="alert">{error}</div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
        <section className="about" id="about">
          <div className="container about-inner">
            <div>
              <h2>От идеи до двери — спокойно и прозрачно.</h2>
            </div>
            <div>
              <p>
                CartCraft объединяет аккуратный каталог, безопасное оформление и
                понятную историю каждого заказа.
              </p>
              <Link href="/account" className="text-link">
                Перейти в личный кабинет <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="container">CartCraft · учебный full-stack проект</div>
      </footer>
    </>
  );
}
