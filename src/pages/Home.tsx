import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Banner, Category, Product } from "../../shared/types";
import { brand } from "../brand";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { IconArrowRight, IconCheck, IconMapPin, IconPackage, IconTruck, IconWhatsApp } from "../components/icons";
import { ErrorState, buttonClass, Spinner, cn } from "../components/ui";
import { buildGeneralMessage, waLink } from "../lib/whatsapp";
import { useRealtimeRefresh } from "../lib/realtime";
import { requireSupabase } from "../lib/supabaseClient";

type LoadState = "loading" | "ready" | "error";

const CATEGORY_ICONS: Record<string, string> = {
  laptops: "💻",
  phones: "📱",
  furniture: "🪑",
  starlink: "📡",
  services: "🖨️",
  other: "🛍️",
};

const TRUST_ITEMS = [
  { icon: <IconMapPin className="h-4 w-4" />, label: "Based in Ogoja, Cross River" },
  { icon: <IconWhatsApp className="h-4 w-4" />, label: "Orders confirmed on WhatsApp" },
  { icon: <IconTruck className="h-4 w-4" />, label: "Delivery requested for anywhere" },
  { icon: <IconCheck className="h-4 w-4" />, label: "Photocopying in Ogoja only" },
];

export default function Home() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback((silent = false) => {
    if (!silent) setState("loading");
    const supabase = requireSupabase();
    Promise.all([
      supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("products")
        .select("*, category:categories(id, name, slug)")
        .order("created_at", { ascending: false })
        .limit(16),
    ])
      .then(([bannerRes, categoryRes, productRes]) => {
        const firstError = bannerRes.error ?? categoryRes.error ?? productRes.error;
        if (firstError) throw firstError;
        setBanners(bannerRes.data ?? []);
        setCategories(categoryRes.data ?? []);
        setProducts(productRes.data ?? []);
        setState("ready");
      })
      .catch((err: unknown) => {
        console.error("[home]", err);
        setState("error");
      });
  }, []);

  useEffect(load, [load]);

  // Instant sync: edits made in the app (or dashboard) refresh the page.
  useRealtimeRefresh(["products", "categories", "banners"], load);

  const hero = banners[0];
  const featured = products.filter((p) => p.is_featured).slice(0, 8);
  const shownFeatured = featured.length > 0 ? featured : products.slice(0, 8);
  const collage = products.slice(0, 3);

  return (
    <>
      {/* ------------------------------------------------ Hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        {hero?.image_url ? (
          <img
            src={hero.image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : null}
        <div
          className="absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-brand-600/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-52 right-0 h-[30rem] w-[30rem] rounded-full bg-accent-500/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="page-container relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold ring-1 ring-white/15">
              <IconMapPin className="h-3.5 w-3.5 text-brand-300" />
              {brand.location}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {hero?.title ?? brand.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              {hero?.subtitle ??
                "New and A1 London-used office equipment, furniture, Starlink installation and services — with every order confirmed with you personally on WhatsApp."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className={buttonClass("primary", "lg", "shadow-lg shadow-brand-900/40")}>
                Browse the shop
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waLink(buildGeneralMessage())}
                target="_blank"
                rel="noreferrer"
                className={buttonClass("whatsapp", "lg")}
              >
                <IconWhatsApp className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Floating product collage (placeholder art until real photos) */}
          <div className="relative hidden h-80 lg:block" aria-hidden="true">
            {collage.map((product, index) => (
              <div
                key={product.id}
                className={cn(
                  "absolute w-56 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40",
                  index === 0 && "left-4 top-4 -rotate-6",
                  index === 1 && "right-6 top-0 rotate-3",
                  index === 2 && "bottom-0 left-1/3 rotate-1",
                )}
              >
                <ProductImage
                  name={product.name}
                  src={product.image_url}
                  category={product.category?.name}
                  className="aspect-[4/3]"
                />
                <div className="bg-white px-3 py-2">
                  <p className="truncate text-xs font-bold text-ink-900">
                    {product.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="relative border-t border-white/10 bg-white/[0.04]">
          <div className="page-container grid grid-cols-2 gap-x-6 gap-y-3 py-4 text-xs font-semibold text-ink-300 sm:grid-cols-4">
            {TRUST_ITEMS.map((item) => (
              <span key={item.label} className="flex items-center gap-2">
                <span className="text-brand-400">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------- Categories */}
      <section className="page-container py-14 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Browse
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink-950 sm:text-3xl">
              Shop by category
            </h2>
          </div>
          <Link to="/shop" className="hidden text-sm font-bold text-brand-700 hover:text-brand-800 sm:inline-flex items-center gap-1">
            View all <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {state === "loading" ? (
          <div className="mt-8 flex justify-center py-10">
            <Spinner className="h-7 w-7 text-brand-600" />
          </div>
        ) : state === "error" ? (
          <div className="mt-8">
            <ErrorState message="Could not load categories." onRetry={load} />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-ink-200/70 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                  {CATEGORY_ICONS[category.slug] ?? "🛍️"}
                </span>
                <span className="font-display text-sm font-bold text-ink-900 group-hover:text-brand-700">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------ Featured */}
      <section className="border-y border-ink-200/60 bg-white">
        <div className="page-container py-14 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                Hand-picked
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-ink-950 sm:text-3xl">
                Featured picks
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              All products <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {state === "loading" ? (
            <div className="mt-8 flex justify-center py-10">
              <Spinner className="h-7 w-7 text-brand-600" />
            </div>
          ) : state === "error" ? (
            <div className="mt-8">
              <ErrorState message="Could not load products." onRetry={load} />
            </div>
          ) : shownFeatured.length === 0 ? (
            <p className="mt-8 text-sm text-ink-500">
              Products will appear here once they are added.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {shownFeatured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------ Services */}
      <section className="page-container py-14 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
          What we do
        </p>
        <h2 className="mt-1 text-2xl font-extrabold text-ink-950 sm:text-3xl">
          More than a shop
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <ServiceCard
            icon="📡"
            title="Starlink installation"
            body="Kits, roof mounting and activation anywhere in Ogoja and across Cross River State. We set it up and test the speeds with you."
            action={
              <Link to="/category/starlink" className={buttonClass("outline", "sm")}>
                See Starlink services
              </Link>
            }
          />
          <ServiceCard
            icon="🖨️"
            title="Photocopying & printing"
            badge="Ogoja only"
            body="Photocopies, colour printing, spiral binding and lamination for projects, reports and certificates. Send documents on WhatsApp and pick up the same day."
            action={
              <Link to="/category/services" className={buttonClass("outline", "sm")}>
                See services
              </Link>
            }
          />
          <ServiceCard
            icon="🚚"
            title="Delivery & waybill"
            body="Buying from outside Ogoja? Request delivery and we'll arrange it with you. Costs are always discussed directly — no surprise fees."
            action={
              <Link to="/delivery" className={buttonClass("outline", "sm")}>
                Request delivery
              </Link>
            }
          />
        </div>
      </section>

      {/* ------------------------------------------ CTA band */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="page-container flex flex-col items-start gap-6 py-14 sm:flex-row sm:items-center sm:justify-between sm:py-16">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Ready to order? It starts on WhatsApp.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-100">
              Add products to your order request, send it straight to Bikoom and
              confirm final prices, availability and delivery — no online
              payment required.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/shop" className={buttonClass("dark", "lg")}>
              <IconPackage className="h-4 w-4" /> Start shopping
            </Link>
            <a
              href={waLink(buildGeneralMessage())}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("accent", "lg")}
            >
              <IconWhatsApp className="h-4 w-4" /> Message us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function ServiceCard({
  icon,
  title,
  body,
  action,
  badge,
}: {
  icon: string;
  title: string;
  body: string;
  action: ReactNode;
  badge?: string;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl">
          {icon}
        </span>
        {badge ? (
          <span className="rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-bold text-accent-700">
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink-950">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{body}</p>
      <div className="mt-5">{action}</div>
    </article>
  );
}
