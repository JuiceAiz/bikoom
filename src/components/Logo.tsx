import { brand } from "../brand";
import { cn } from "./ui";

/** Rounded gradient mark with a "B". */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bikoom-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1faf7f" />
          <stop offset="100%" stopColor="#0e7052" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#bikoom-mark)" />
      <path
        d="M13 10.5h8.4c3.2 0 5.4 1.6 5.4 4.3 0 1.8-1 3.1-2.6 3.7 2.1.6 3.4 2.1 3.4 4.4 0 3.1-2.4 5-6 5H13V10.5zm4.6 3.7v3.6h3.3c1.3 0 2.1-.7 2.1-1.8s-.8-1.8-2.1-1.8h-3.3zm0 7v4h3.7c1.5 0 2.4-.8 2.4-2s-.9-2-2.4-2h-3.7z"
        fill="white"
      />
    </svg>
  );
}

/** Wordmark: "Bikoom" + " Stores". */
export function Wordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "font-display text-lg font-extrabold tracking-tight",
        tone === "dark" ? "text-ink-950" : "text-white",
        className,
      )}
    >
      {brand.shortName}
      <span className={tone === "dark" ? "text-brand-600" : "text-brand-300"}>
        {brand.name.slice(brand.shortName.length)}
      </span>
    </span>
  );
}

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-9 w-9" />
      <Wordmark tone={tone} />
    </span>
  );
}
