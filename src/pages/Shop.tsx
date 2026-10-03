import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { Category, Product } from "../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { IconSearch } from "../components/icons";
import {
  EmptyState,
  ErrorState,
  Input,
  Select,
  Spinner,
  cn,
} from "../components/ui";
import { requireSupabase } from "../lib/supabaseClient";

type LoadState = "loading" | "ready" | "error";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function priceValue(product: Product): number {
  if (!product.show_price || product.price === null) return Number.POSITIVE_INFINITY;
  return Number(product.price);
}

export default function Shop() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const categorySlug = slug ?? searchParams.get("category") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [query, setQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("newest");

  const load = useCallback(() => {
    setLoadState("loading");
    const supabase = requireSupabase();
    Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(id, name, slug)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ])
      .then(([productRes, categoryRes]) => {
        if (productRes.error) throw productRes.error;
        if (categoryRes.error) throw categoryRes.error;
        setProducts(productRes.data ?? []);
        setCategories(categoryRes.data ?? []);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        console.error("[shop]", err);
        setLoadState("error");
      });
  }, []);

  useEffect(load, [load]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug) ?? null,
    [categories, categorySlug],
  );

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    let list = products.filter((product) => {
      if (categorySlug && product.category?.slug !== categorySlug) return false;
      if (inStockOnly && !product.is_available) return false;
      if (search) {
        const haystack = `${product.name} ${product.description} ${
          product.category?.name ?? ""
        }`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
    list = [...list];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "price-asc")
      list.sort((a, b) => priceValue(a) - priceValue(b));
    else if (sort === "price-desc")
      list.sort((a, b) => priceValue(b) - priceValue(a));
    return list;
  }, [products, categorySlug, query, inStockOnly, sort]);

  const heading = activeCategory ? activeCategory.name : "Shop";

  return (
    <div className="page-container py-10 sm:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-ink-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        {activeCategory ? (
          <>
            <Link to="/shop" className="hover:text-brand-700">Shop</Link>
            <span>/</span>
            <span className="text-ink-600">{activeCategory.name}</span>
          </>
        ) : (
          <span className="text-ink-600">Shop</span>
        )}
      </nav>

      <div className="mt-3">
        <h1 className="text-3xl font-extrabold text-ink-950 sm:text-4xl">
          {heading}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
          {activeCategory?.description ??
            "Browse every product from the Bikoom Store. Prices shown are displayed prices — final pricing is confirmed with you on WhatsApp."}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-10"
            aria-label="Search products"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-48">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-600">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            In stock only
          </label>
        </div>
      </div>

      {/* Category pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to="/shop"
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
            !categorySlug
              ? "bg-ink-950 text-white"
              : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50",
          )}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
              categorySlug === category.slug
                ? "bg-ink-950 text-white"
                : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {/* Results */}
      <div className="mt-8">
        {loadState === "loading" ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 text-brand-600" />
          </div>
        ) : loadState === "error" ? (
          <ErrorState message="Could not load products." onRetry={load} />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No products found"
            description={
              query
                ? `Nothing matches “${query}”. Try a different search or clear the filters.`
                : "This category is empty for now — check back soon."
            }
            action={
              <Link to="/shop" className="text-sm font-bold text-brand-700">
                View all products
              </Link>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-xs font-semibold text-ink-400">
              {visible.length} product{visible.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
