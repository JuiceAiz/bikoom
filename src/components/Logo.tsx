import { brand } from "../brand";
import { cn } from "./ui";

/** Current BHL emblem, with its white center preserved on dark surfaces. */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img
      src="/bikoom-bhl-logo.png"
      alt=""
      aria-hidden="true"
      className={cn("object-contain", className)}
    />
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
      <LogoMark className="h-9 w-9 sm:h-10 sm:w-10" />
      <Wordmark tone={tone} className="max-[359px]:text-sm" />
    </span>
  );
}
