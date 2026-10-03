import { cn } from "./ui";

// ------------------------------------------------------------
// Generated placeholder art — shown when a product has no image
// (demo data). Real photos uploaded in the admin replace it.
// ------------------------------------------------------------
const PALETTES: Array<[string, string]> = [
  ["#0e7052", "#1faf7f"],
  ["#0b1220", "#334155"],
  ["#b45309", "#f59e0b"],
  ["#0e5943", "#43c99a"],
  ["#1e293b", "#475569"],
  ["#7c2d12", "#ea580c"],
  ["#0c4938", "#128c64"],
  ["#312e81", "#6366f1"],
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "B";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function PlaceholderArt({
  name,
  category,
}: {
  name: string;
  category?: string | null;
}) {
  const seed = hashString(name);
  const paletteIndex = seed % PALETTES.length;
  const [from, to] = PALETTES[paletteIndex];
  const gradientId = `bikoom-palette-${paletteIndex}`;

  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full"
      role="img"
      aria-label={`${name} (placeholder image)`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${gradientId})`} />
      <circle cx="345" cy="35" r="95" fill="#ffffff" opacity="0.07" />
      <circle cx="55" cy="275" r="80" fill="#ffffff" opacity="0.06" />
      <circle cx="70" cy="40" r="34" fill="#ffffff" opacity="0.05" />
      <text
        x="200"
        y={category ? 155 : 170}
        textAnchor="middle"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fontWeight="800"
        fontSize="88"
        fill="#ffffff"
        opacity="0.95"
      >
        {initialsOf(name)}
      </text>
      {category ? (
        <text
          x="200"
          y="205"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
          fontSize="17"
          letterSpacing="3"
          fill="#ffffff"
          opacity="0.75"
        >
          {category.toUpperCase()}
        </text>
      ) : null}
    </svg>
  );
}

/**
 * Product / banner imagery: real image when available, generated
 * placeholder art otherwise.
 */
export function ProductImage({
  name,
  src,
  category,
  className,
  imgClassName,
}: {
  name: string;
  src?: string | null;
  category?: string | null;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden bg-ink-100", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <PlaceholderArt name={name} category={category} />
      )}
    </div>
  );
}
