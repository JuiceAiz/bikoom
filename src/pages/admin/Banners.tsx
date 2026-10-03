import { useCallback, useEffect, useState } from "react";
import type { Banner } from "../../../shared/types";
import { api } from "../../lib/api";
import { ImageInput } from "../../components/ImageInput";
import { IconPlus, IconTrash } from "../../components/icons";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Spinner,
  Toggle,
} from "../../components/ui";

function BannerCard({
  banner,
  onDelete,
}: {
  banner: Banner;
  onDelete: (banner: Banner) => void;
}) {
  const [title, setTitle] = useState(banner.title);
  const [subtitle, setSubtitle] = useState(banner.subtitle ?? "");
  const [linkUrl, setLinkUrl] = useState(banner.link_url ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(banner.image_url);
  const [isActive, setIsActive] = useState(banner.is_active);
  const [sortOrder, setSortOrder] = useState(String(banner.sort_order));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    title !== banner.title ||
    subtitle !== (banner.subtitle ?? "") ||
    linkUrl !== (banner.link_url ?? "") ||
    imageUrl !== banner.image_url ||
    isActive !== banner.is_active ||
    sortOrder !== String(banner.sort_order);

  const handleSave = async () => {
    if (title.trim().length < 2) {
      setError("Banner title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.admin.updateBanner(banner.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        linkUrl: linkUrl.trim(),
        imageUrl,
        isActive,
        sortOrder: Number(sortOrder) || 0,
      });
      setMessage("Saved ✓");
      window.setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the banner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-ink-300"}`}
            aria-hidden="true"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
            {isActive ? "Active on homepage" : "Hidden"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onDelete(banner)}
          aria-label={`Delete banner ${banner.title}`}
          className="rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </Field>
        </div>
        <div className="space-y-4">
          <Field label="Link" hint="Where the banner points, e.g. /shop">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/shop"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sort order">
              <Input
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                inputMode="numeric"
              />
            </Field>
            <div className="pt-6">
              <Toggle checked={isActive} onChange={setIsActive} label="Active" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ImageInput
          value={imageUrl}
          onChange={setImageUrl}
          bucket="banners"
          label="Banner image (optional — a brand gradient is used without one)"
          previewName={title || "Banner"}
        />
      </div>

      {error ? (
        <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
          {saving ? <Spinner className="h-4 w-4" /> : null}
          Save banner
        </Button>
        {message ? (
          <span className="text-xs font-bold text-brand-700">{message}</span>
        ) : null}
      </div>
    </li>
  );
}

export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadState("loading");
    api
      .admin.banners()
      .then((data) => {
        setBanners(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        console.error("[admin/banners]", err);
        setLoadState("error");
      });
  }, []);

  useEffect(load, [load]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await api.admin.createBanner({
        title: "New banner",
        subtitle: "Describe what customers should see here",
        linkUrl: "/shop",
        isActive: false,
        sortOrder: banners.length + 1,
      });
      setBanners((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the banner.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    const confirmed = window.confirm(`Delete banner "${banner.title}"?`);
    if (!confirmed) return;
    setError(null);
    try {
      await api.admin.deleteBanner(banner.id);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the banner.");
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
    return <ErrorState message="Could not load banners." onRetry={load} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-500">
          Banners rotate at the top of the homepage in sort order. Images are
          optional — without one the hero uses the brand gradient.
        </p>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? <Spinner className="h-4 w-4" /> : <IconPlus className="h-4 w-4" />}
          New banner
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {banners.length === 0 ? (
        <EmptyState
          title="No banners yet"
          description="Create a banner to control the homepage hero."
          action={
            <Button onClick={handleCreate} disabled={creating}>
              <IconPlus className="h-4 w-4" /> New banner
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {banners.map((banner) => (
            <BannerCard key={banner.id} banner={banner} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
