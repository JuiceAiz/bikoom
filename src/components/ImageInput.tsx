import { useRef, useState } from "react";
import { api } from "../lib/api";
import { ProductImage } from "./ProductImage";
import { Spinner, cn } from "./ui";

/**
 * Image uploader bound to Supabase Storage via the admin API.
 * Shows a preview of the current value.
 */
export function ImageInput({
  value,
  onChange,
  bucket,
  label,
  previewName,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: "products" | "banners";
  label: string;
  previewName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await api.admin.upload(file, bucket);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</span>
      <div className="flex items-start gap-4">
        <div className="h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
          <ProductImage name={previewName} src={value} className="h-full w-full" />
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:bg-ink-50",
              uploading && "opacity-60",
            )}
          >
            {uploading ? (
              <>
                <Spinner className="h-3.5 w-3.5" /> Uploading…
              </>
            ) : value ? (
              "Replace image"
            ) : (
              "Upload image"
            )}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="block text-xs font-semibold text-red-600 hover:underline"
            >
              Remove image
            </button>
          ) : null}
          <p className="text-[11px] leading-snug text-ink-400">
            PNG, JPG or WEBP up to 5MB. Saved to Supabase Storage.
          </p>
        </div>
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
