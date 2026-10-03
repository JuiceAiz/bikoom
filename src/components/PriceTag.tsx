import { formatNaira } from "../lib/format";
import { cn } from "./ui";

/**
 * Shows the ₦ price when show_price is on, otherwise the
 * "Contact for Price" chip.
 */
export function PriceTag({
  price,
  showPrice,
  size = "sm",
  className,
}: {
  price: number | string | null;
  showPrice: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  if (showPrice && price !== null && price !== undefined && price !== "") {
    return (
      <span
        className={cn(
          "font-display font-bold text-ink-950",
          size === "lg" ? "text-3xl" : "text-base",
          className,
        )}
      >
        {formatNaira(price)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg bg-accent-100 font-semibold text-accent-700",
        size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs",
        className,
      )}
    >
      Contact for Price
    </span>
  );
}
