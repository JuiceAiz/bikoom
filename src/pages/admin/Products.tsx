import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../../shared/types";
import { api } from "../../lib/api";
import { ProductImage } from "../../components/ProductImage";
import {
  IconPencil,
  IconPlus,
  IconSearch,
  IconStarFilled,
  IconTrash,
} from "../../components/icons";
import {
  Badge,
  EmptyState,
  ErrorState,
  Input,
  Spinner,
  buttonClass,
} from "../../components/ui";

type LoadState = "loading" | "ready" | "error";

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadState("loading");
    api
      .admin.products()
      .then((data) => {
        setProducts(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        console.error("[admin/products]", err);
        setLoadState("error");
      });
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products;
    return products.filter((product) =>
      `${product.name} ${product.category?.name ?? ""}`.toLowerCase().includes(search),
    );
  }, [products, query]);

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeleting(product.id);
    setError(null);
    try {
      await api.admin.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the product.");
    } finally {
      setDeleting(null);
    }
  };

  if (loadState === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-brand-600" />
      </div>
    );
  }
  if (loadState === "error") {
    return <ErrorState message="Could not load products." onRetry={load} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Link to="/admin/products/new" className={buttonClass("primary", "md")}>
          <IconPlus className="h-4 w-4" /> Add product
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title={query ? "No products match your search" : "No products yet"}
          description={
            query
              ? "Try a different search term."
              : "Add your first product to populate the shop."
          }
          action={
            <Link to="/admin/products/new" className={buttonClass("primary", "sm")}>
              <IconPlus className="h-4 w-4" /> Add product
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-sm">
          <div className="scroll-x">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {visible.map((product) => (
                  <tr key={product.id} className="transition hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          name={product.name}
                          src={product.image_url}
                          className="h-11 w-14 shrink-0 rounded-lg"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-semibold text-ink-900">
                            <span className="truncate">{product.name}</span>
                            {product.is_featured ? (
                              <IconStarFilled className="h-3.5 w-3.5 shrink-0 text-accent-500" />
                            ) : null}
                          </p>
                          <p className="truncate text-xs text-ink-400">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {product.show_price && product.price !== null ? (
                        <span className="font-bold text-ink-900">
                          ₦{Number(product.price).toLocaleString("en-NG")}
                        </span>
                      ) : (
                        <Badge tone="amber">Contact for Price</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={product.is_available ? "green" : "red"}>
                        {product.is_available ? "In stock" : "Out of stock"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/products/${product.id}`}
                          aria-label={`Edit ${product.name}`}
                          className="rounded-lg p-2 text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                        >
                          <IconPencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={deleting === product.id}
                          aria-label={`Delete ${product.name}`}
                          className="rounded-lg p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {deleting === product.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <IconTrash className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
