import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../shared/types";
import { useCart } from "../context/CartContext";
import { PriceTag } from "./PriceTag";
import { ProductImage } from "./ProductImage";
import { IconCheck, IconStarFilled } from "./icons";
import { cn } from "./ui";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleAdd = () => {
    if (!product.is_available) return;
    add(product, 1);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1400);
  };

  const categoryName = product.category?.name ?? null;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
        aria-label={product.name}
      >
        <ProductImage
          name={product.name}
          src={product.image_url}
          category={categoryName}
          className="h-full w-full"
          imgClassName="transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 flex gap-2">
          {product.is_featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold text-ink-950 shadow-sm">
              <IconStarFilled className="h-3 w-3" /> Featured
            </span>
          ) : null}
          {!product.is_available ? (
            <span className="rounded-full bg-ink-950/85 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
              Out of stock
            </span>
          ) : null}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          {categoryName ? (
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
              {categoryName}
            </span>
          ) : (
            <span />
          )}
        </div>
        <Link
          to={`/product/${product.slug}`}
          className="mt-1 font-display text-[15px] font-bold leading-snug text-ink-900 transition group-hover:text-brand-700"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <PriceTag price={product.price} showPrice={product.show_price} />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.is_available}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition",
              added
                ? "bg-brand-600 text-white"
                : "bg-ink-950 text-white hover:bg-brand-600",
              !product.is_available && "cursor-not-allowed bg-ink-200 text-ink-500 hover:bg-ink-200",
            )}
          >
            {added ? (
              <>
                <IconCheck className="h-3.5 w-3.5" /> Added
              </>
            ) : product.is_available ? (
              "Add to cart"
            ) : (
              "Unavailable"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
