import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { brand } from "../brand";
import { ProductImage } from "../components/ProductImage";
import {
  IconArrowRight,
  IconCheck,
  IconTrash,
  IconWhatsApp,
} from "../components/icons";
import {
  Button,
  Callout,
  EmptyState,
  Field,
  Input,
  Spinner,
  Textarea,
  buttonClass,
  cn,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { formatNaira } from "../lib/format";
import { buildOrderMessage, waLink } from "../lib/whatsapp";

interface FormErrors {
  name?: string;
  phone?: string;
  location?: string;
}

export default function Cart() {
  const { items, setQuantity, remove, clear, pricedTotal, hasContactForPrice, count } =
    useCart();
  const { profile, session } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName((current) => current || profile.full_name || "");
    }
  }, [profile]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (phone.replace(/[^\d+]/g, "").length < 7)
      next.phone = "Enter a valid phone / WhatsApp number.";
    if (location.trim() && location.trim().length < 2)
      next.location = "Enter your location, or leave it blank for pickup.";
    return next;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const message = buildOrderMessage({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        showPrice: item.showPrice,
      })),
    });

    setSubmitting(true);
    try {
      await api.postOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerLocation: location.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          showPrice: item.showPrice,
        })),
      });
      // Record saved (+ Mailgun e-mail queued) — now open WhatsApp.
      window.open(waLink(message), "_blank", "noopener");
      setSuccessMessage(message);
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------ Success
  if (successMessage) {
    return (
      <div className="page-container py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-ink-200/70 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <IconCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-ink-950">
            Order request sent
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            Your request has been saved and WhatsApp is opening with your
            items. Bikoom will confirm prices, availability and delivery with
            you there — no payment happens online.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={waLink(successMessage)}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("whatsapp", "lg")}
            >
              <IconWhatsApp className="h-4 w-4" /> Open WhatsApp again
            </a>
            <Link to="/shop" className={buttonClass("outline", "lg")}>
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------ Empty
  if (items.length === 0) {
    return (
      <div className="page-container py-16">
        <h1 className="text-3xl font-extrabold text-ink-950">Your order request</h1>
        <div className="mt-8">
          <EmptyState
            title="Nothing here yet"
            description="Add products from the shop and send them to Bikoom as one order request on WhatsApp."
            action={
              <Link to="/shop" className={buttonClass("primary")}>
                Browse products <IconArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // ------------------------------------------------ Form
  return (
    <div className="page-container py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-950">
            Your order request
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Review your items, add your details, then continue to WhatsApp.
          </p>
        </div>
        <Link to="/shop" className="text-sm font-bold text-brand-700 hover:text-brand-800">
          + Add more products
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items + details */}
        <div className="space-y-6">
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 rounded-2xl border border-ink-200/70 bg-white p-4 shadow-sm"
              >
                <Link to={`/product/${item.slug}`} className="shrink-0">
                  <ProductImage
                    name={item.name}
                    src={item.imageUrl}
                    className="h-20 w-24 rounded-xl"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-ink-900">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-ink-600">
                        {item.showPrice && item.price !== null
                          ? `${formatNaira(item.price)} each`
                          : "Contact for price"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="rounded-lg p-2 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center rounded-lg border border-ink-200">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-ink-600 hover:text-ink-950"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-ink-600 hover:text-ink-950"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold text-ink-900">
                      {item.showPrice && item.price !== null
                        ? formatNaira(item.price * item.quantity)
                        : "—"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Customer details */}
          <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-ink-950">Your details</h2>
            <p className="mt-1 text-xs text-ink-500">
              Used by Bikoom to confirm your request on WhatsApp.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ada Obi"
                  autoComplete="name"
                />
              </Field>
              <Field label="Phone / WhatsApp number" required error={errors.phone}>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0803 000 0000"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Field
                label="Delivery location"
                error={errors.location}
                hint="Leave blank if you're picking up in Ogoja."
                className="sm:col-span-2"
              >
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ogoja town, Calabar, Abuja…"
                />
              </Field>
              <Field
                label="Notes for Bikoom"
                hint="Colour preferences, questions, timing…"
                className="sm:col-span-2"
              >
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything Bikoom should know about your order…"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-ink-950">Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-600">
                <dt>Items</dt>
                <dd className="font-semibold text-ink-800">{count}</dd>
              </div>
              <div className="flex justify-between text-ink-600">
                <dt>Displayed total</dt>
                <dd className="font-bold text-ink-950">
                  {pricedTotal > 0 ? formatNaira(pricedTotal) : "—"}
                </dd>
              </div>
            </dl>

            {hasContactForPrice ? (
              <div className="mt-4">
                <Callout tone="warning">
                  Some items don't show a price — Bikoom will quote those on
                  WhatsApp.
                </Callout>
              </div>
            ) : null}

            {submitError ? (
              <div className="mt-4">
                <Callout tone="warning">
                  <span className="font-semibold">{submitError}</span>
                </Callout>
              </div>
            ) : null}

            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 w-full"
            >
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" /> Sending…
                </>
              ) : (
                <>
                  <IconWhatsApp className="h-4 w-4" /> Send order via WhatsApp
                </>
              )}
            </Button>

            {!session ? (
              <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2.5 text-center text-xs leading-relaxed text-ink-500">
                No account needed — you can send this as a guest. Signing in
                with Google just saves your details for next time:{" "}
                <Link
                  to="/signin?next=/cart"
                  className="font-bold text-brand-700 hover:text-brand-800"
                >
                  sign in
                </Link>
                .
              </p>
            ) : null}

            <p className="mt-3 text-center text-xs leading-relaxed text-ink-400">
              No online payment. Your request is saved and a pre-filled message
              opens in WhatsApp so you and {brand.shortName} can confirm the
              final price and delivery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/delivery")}
            className={cn(
              "mt-4 w-full rounded-2xl border border-dashed border-ink-300 bg-white/60 px-4 py-3 text-sm font-semibold text-ink-600 transition hover:border-brand-400 hover:text-brand-700",
            )}
          >
            Need delivery? Send a waybill request →
          </button>
        </aside>
      </div>
    </div>
  );
}
