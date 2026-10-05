import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Product } from "../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { PriceTag } from "../components/PriceTag";
import { ProductImage } from "../components/ProductImage";
import {
  IconArrowLeft,
  IconCheck,
  IconMapPin,
  IconStarFilled,
  IconWhatsApp,
} from "../components/icons";
import {
  Badge,
  Button,
  ErrorState,
  Spinner,
  buttonClass,
  cn,
} from "../components/ui";
import { useCart } from "../context/CartContext";
import { productChatLink } from "../lib/whatsapp";
import { useRealtimeRefresh } from "../lib/realtime";
import { requireSupabase } from "../lib/supabaseClient";

type LoadState = "loading" | "ready" | "error";

export default function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const load = useCallback((silent = false) => {
    if (!slug) return;
    if (!silent) setLoadState("loading");
    setNotFound(false);
    const supabase = requireSupabase();
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .eq("slug", slug)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setNotFound(true);
          setLoadState("error");
          return;
        }
        setProduct(data as Product);
        setLoadState("ready");
        if (data.category_id) {
          const { data: relatedData } = await supabase
            .from("products")
            .select("*, category:categories(id, name, slug)")
            .eq("category_id", data.category_id)
            .neq("id", data.id)
            .limit(4);
          setRelated((relatedData ?? []) as Product[]);
        }
      } catch (err: unknown) {
        console.error("[product]", err);
        setLoadState("error");
      }
    })();
  }, [slug]);

  useEffect(load, [load]);

  useRealtimeRefresh(["products"], load);
  useEffect(() => {
    setQuantity(1);
    setImageIndex(0);
    setAdded(false);
  }, [slug]);

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[50vh] justify-center py-20">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }

  if (loadState === "error" || !product) {
    return (
      <div className="page-container py-16">
        {notFound ? (
          <ErrorState message="This product doesn't exist (it may have been removed)." />
        ) : (
          <ErrorState message="Could not load this product." onRetry={load} />
        )}
        <div className="mt-6 text-center">
          <Link to="/shop" className={buttonClass("outline")}>
            <IconArrowLeft className="h-4 w-4" /> Back to the shop
          </Link>
        </div>
      </div>
    );
  }

  const gallery = [product.image_url, ...(product.images ?? [])].filter(
    (value): value is string => Boolean(value),
  );
  const activeImage = gallery[imageIndex] ?? product.image_url;

  const handleAdd = () => {
    add(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="page-container py-8 sm:py-12">
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-ink-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand-700">Shop</Link>
        <span>/</span>
        {product.category ? (
          <>
            <Link to={`/category/${product.category.slug}`} className="hover:text-brand-700">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        ) : null}
        <span className="text-ink-600">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <ProductImage
            name={product.name}
            src={activeImage}
            category={product.category?.name}
            className="aspect-[4/3] w-full rounded-2xl border border-ink-200/70 shadow-sm"
          />
          {gallery.length > 1 ? (
            <div className="mt-3 flex gap-3">
              {gallery.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  className={cn(
                    "h-16 w-20 overflow-hidden rounded-lg border-2 transition",
                    index === imageIndex
                      ? "border-brand-600"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <ProductImage name={product.name} src={url} className="h-full w-full" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.category ? (
              <Link to={`/category/${product.category.slug}`}>
                <Badge tone="brand">{product.category.name}</Badge>
              </Link>
            ) : null}
            {product.is_featured ? (
              <Badge tone="amber">
                <IconStarFilled className="h-3 w-3" /> Featured
              </Badge>
            ) : null}
            <Badge tone={product.is_available ? "green" : "red"}>
              {product.is_available ? "In stock" : "Out of stock"}
            </Badge>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink-950 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4">
            <PriceTag price={product.price} showPrice={product.show_price} size="lg" />
            {!product.show_price ? (
              <p className="mt-2 text-sm text-ink-500">
                Chat with us on WhatsApp for today's price and bundle deals.
              </p>
            ) : null}
          </div>

          <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink-600">
            {product.description}
          </div>

          {/* Purchase row */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-ink-200 bg-white">
              <button
                type="button"
                className="px-3.5 py-2.5 text-ink-600 transition hover:text-ink-950 disabled:opacity-40"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold">{quantity}</span>
              <button
                type="button"
                className="px-3.5 py-2.5 text-ink-600 transition hover:text-ink-950 disabled:opacity-40"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                disabled={quantity >= 99}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <Button
              size="lg"
              onClick={handleAdd}
              disabled={!product.is_available}
              className={cn(added && "bg-brand-700")}
            >
              {added ? (
                <>
                  <IconCheck className="h-4 w-4" /> Added to order request
                </>
              ) : product.is_available ? (
                "Add to order request"
              ) : (
                "Currently unavailable"
              )}
            </Button>

            <a
              href={productChatLink(product.name)}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("whatsapp", "lg")}
            >
              <IconWhatsApp className="h-4 w-4" /> Ask on WhatsApp
            </a>
          </div>

          {added ? (
            <Link
              to="/cart"
              className="mt-3 inline-block text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              View your order request →
            </Link>
          ) : null}

          {/* Info rows */}
          <ul className="mt-8 divide-y divide-ink-100 rounded-2xl border border-ink-200/70 bg-white text-sm">
            <li className="flex items-start gap-3 px-4 py-3.5">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span className="text-ink-600">
                Picked up in <strong className="text-ink-800">Ogoja</strong>, or
                delivered anywhere — delivery cost discussed directly on WhatsApp.
              </span>
            </li>
            <li className="flex items-start gap-3 px-4 py-3.5">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span className="text-ink-600">
                No online payment. You confirm the final price with Bikoom before
                paying.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-xl font-extrabold text-ink-950">
            You may also like
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
