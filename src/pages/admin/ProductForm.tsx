import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Category, Product } from "../../../shared/types";
import { slugify } from "../../../shared/util";
import { api } from "../../lib/api";
import { ImageInput } from "../../components/ImageInput";
import { IconArrowLeft, IconTrash } from "../../components/icons";
import {
  Button,
  Callout,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
  Toggle,
} from "../../components/ui";

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  showPrice: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  price: "",
  showPrice: true,
  isAvailable: true,
  isFeatured: false,
  imageUrl: null,
};

export function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    isEdit ? "loading" : "ready",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(false);

  const load = useCallback(async () => {
    setLoadState("loading");
    setError(null);
    try {
      const [cats, products] = await Promise.all([
        api.admin.categories(),
        isEdit ? api.admin.products() : Promise.resolve([] as Product[]),
      ]);
      setCategories(cats);
      if (isEdit) {
        const product = products.find((p) => p.id === id);
        if (!product) {
          setError("Product not found.");
          setLoadState("error");
          return;
        }
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.category_id ?? "",
          price: product.price != null ? String(product.price) : "",
          showPrice: product.show_price,
          isAvailable: product.is_available,
          isFeatured: product.is_featured,
          imageUrl: product.image_url,
        });
        setSlugTouched(true);
      }
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the form.");
      setLoadState("error");
    }
  }, [id, isEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Product name is required.";
    if (!slugify(form.slug)) next.slug = "A valid slug is required.";
    if (form.showPrice) {
      const price = Number(form.price);
      if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
        next.price = "Enter a price (or turn off Show Price).";
      }
    }
    return next;
  };

  const handleSave = async () => {
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description.trim(),
      categoryId: form.categoryId || null,
      price: form.showPrice ? Number(form.price) : null,
      showPrice: form.showPrice,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      imageUrl: form.imageUrl,
    };
    try {
      if (isEdit && id) {
        await api.admin.updateProduct(id, payload);
      } else {
        await api.admin.createProduct(payload);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm(
      `Delete "${form.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      await api.admin.deleteProduct(id);
      navigate("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the product.");
      setDeleting(false);
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
    return (
      <div className="space-y-4">
        <Callout tone="warning">{error ?? "Could not load the product."}</Callout>
        <Link to="/admin/products" className="text-sm font-bold text-brand-700">
          ← Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-600 hover:text-ink-950"
        >
          <IconArrowLeft className="h-4 w-4" /> Back to products
        </Link>
        <div className="flex items-center gap-3">
          {isEdit ? (
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? <Spinner className="h-4 w-4" /> : <IconTrash className="h-4 w-4" />}
              Delete
            </Button>
          ) : null}
          <Button onClick={handleSave} disabled={saving || deleting}>
            {saving ? <Spinner className="h-4 w-4" /> : null}
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>

      {error ? <Callout tone="warning">{error}</Callout> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-ink-950">Product information</h2>
            <div className="mt-4 space-y-4">
              <Field label="Name" required error={fieldErrors.name}>
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. HP EliteBook 840 G8"
                />
              </Field>
              <Field
                label="Slug"
                required
                error={fieldErrors.slug}
                hint="Used in the URL: /product/your-slug"
              >
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    update("slug", e.target.value);
                  }}
                  placeholder="hp-elitebook-840-g8"
                />
              </Field>
              <Field
                label="Description"
                hint="Specs, condition, what's included — customers see this on the product page."
              >
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={6}
                  placeholder="Intel Core i5, 16GB RAM, 512GB SSD…"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-ink-950">Product image</h2>
            <div className="mt-4">
              <ImageInput
                value={form.imageUrl}
                onChange={(url) => update("imageUrl", url)}
                bucket="products"
                label="Main image"
                previewName={form.name || "Product"}
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-ink-950">Pricing & visibility</h2>
            <div className="mt-4 space-y-4">
              <Field label="Category">
                <Select
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Price (₦)" error={fieldErrors.price}>
                <Input
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 785000"
                  disabled={!form.showPrice}
                />
              </Field>

              <Toggle
                checked={form.showPrice}
                onChange={(value) => update("showPrice", value)}
                label="Show price"
                description="Off = customers see “Contact for Price”."
              />
              <Toggle
                checked={form.isAvailable}
                onChange={(value) => update("isAvailable", value)}
                label="In stock"
                description="Out-of-stock products can't be added to carts."
              />
              <Toggle
                checked={form.isFeatured}
                onChange={(value) => update("isFeatured", value)}
                label="Featured"
                description="Show on the homepage featured grid."
              />
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <Link to="/admin/products" className="text-sm font-bold text-ink-500 hover:text-ink-800 self-center">
          Cancel
        </Link>
        <Button onClick={handleSave} disabled={saving || deleting} size="lg">
          {saving ? <Spinner className="h-4 w-4" /> : null}
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </div>
  );
}
