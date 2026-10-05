import { useCallback, useEffect, useState } from "react";
import type { Category } from "../../../shared/types";
import { slugify } from "../../../shared/util";
import { api } from "../../lib/api";
import { useRealtimeRefresh } from "../../lib/realtime";
import { IconPencil, IconPlus, IconTrash } from "../../components/icons";
import {
  Button,
  Callout,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Spinner,
  Textarea,
} from "../../components/ui";

interface FormState {
  name: string;
  description: string;
  sortOrder: string;
}

const EMPTY: FormState = { name: "", description: "", sortOrder: "" };

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoadState("loading");
    api
      .admin.categories()
      .then((data) => {
        setCategories(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        console.error("[admin/categories]", err);
        setLoadState("error");
      });
  }, []);

  useEffect(load, [load]);

  useRealtimeRefresh(["categories", "products"], load);

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? "",
      sortOrder: String(category.sort_order),
    });
    setFieldError(null);
    setError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFieldError(null);
    setError(null);
  };

  const handleSave = async () => {
    if (form.name.trim().length < 2) {
      setFieldError("Category name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.name),
      description: form.description.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editingId) {
        const updated = await api.admin.updateCategory(editingId, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)),
        );
      } else {
        const created = await api.admin.createCategory(payload);
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order),
        );
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Products in it become uncategorised.`,
    );
    if (!confirmed) return;
    setError(null);
    try {
      await api.admin.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      if (editingId === category.id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the category.");
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
    return <ErrorState message="Could not load categories." onRetry={load} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Form */}
      <section className="h-fit rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-ink-950">
          {editingId ? "Edit category" : "Add category"}
        </h2>
        <div className="mt-4 space-y-4">
          <Field label="Name" required error={fieldError}>
            <Input
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                setFieldError(null);
              }}
              placeholder="e.g. Laptops"
            />
          </Field>
          <Field label="Description" hint="Shown on the category page.">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="What belongs in this category?"
            />
          </Field>
          <Field label="Sort order" hint="Lower numbers appear first.">
            <Input
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              inputMode="numeric"
              placeholder="1"
            />
          </Field>
          {error ? <Callout tone="warning">{error}</Callout> : null}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Spinner className="h-4 w-4" /> : null}
              {editingId ? "Save changes" : "Add category"}
            </Button>
            {editingId ? (
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* List */}
      <section>
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Add categories to organise your products."
          />
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200/70 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-bold text-ink-950">
                    {category.name}
                    <span className="ml-2 text-xs font-medium text-ink-400">
                      /{category.slug} · order {category.sort_order}
                    </span>
                  </p>
                  {category.description ? (
                    <p className="mt-0.5 text-sm text-ink-500">{category.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    aria-label={`Edit ${category.name}`}
                    className="rounded-lg p-2 text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <IconPencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    aria-label={`Delete ${category.name}`}
                    className="rounded-lg p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-ink-400">
          <IconPlus className="inline h-3 w-3" /> New categories are linked to
          products from the product form.
        </p>
      </section>
    </div>
  );
}
