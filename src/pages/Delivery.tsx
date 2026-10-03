import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { brand } from "../brand";
import {
  IconCheck,
  IconMapPin,
  IconTruck,
  IconWhatsApp,
} from "../components/icons";
import {
  Button,
  Callout,
  Field,
  Input,
  Spinner,
  Textarea,
  buttonClass,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { buildDeliveryMessage, waLink } from "../lib/whatsapp";

interface FormErrors {
  name?: string;
  phone?: string;
  location?: string;
  productInfo?: string;
}

export default function Delivery() {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setName((current) => current || profile.full_name || "");
  }, [profile]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (phone.replace(/[^\d+]/g, "").length < 7)
      next.phone = "Enter a valid phone / WhatsApp number.";
    if (location.trim().length < 2)
      next.location = "Where should the item be delivered?";
    if (productInfo.trim().length < 2)
      next.productInfo = "Tell us which product or order this is for.";
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

    const message = buildDeliveryMessage({
      name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      productInfo: productInfo.trim(),
      notes: notes.trim() || undefined,
    });

    setSubmitting(true);
    try {
      await api.postDelivery({
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        productInfo: productInfo.trim(),
        notes: notes.trim() || undefined,
      });
      window.open(waLink(message), "_blank", "noopener");
      setSuccessMessage(message);
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

  if (successMessage) {
    return (
      <div className="page-container py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-ink-200/70 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <IconCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-ink-950">
            Delivery request received
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            Your waybill request is saved. WhatsApp is opening so you can send
            it to {brand.shortName} — delivery cost and timing are agreed
            directly with you.
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
              Back to the shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-ink-400" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-brand-700">Home</Link>
            <span>/</span>
            <span className="text-ink-600">Delivery request</span>
          </nav>

          <div className="mt-4 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <IconTruck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold text-ink-950">
                Delivery / waybill request
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
                Ordering from outside Ogoja — or need an item moved? Tell us
                where it's going and we'll arrange delivery with you. Cost and
                timeline are always discussed directly; there are no fixed
                delivery prices.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" required error={errors.name}>
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
                required
                error={errors.location}
                hint="Town / state the item should go to."
                className="sm:col-span-2"
              >
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Calabar, Lagos, Abuja…"
                />
              </Field>
              <Field
                label="Product / order information"
                required
                error={errors.productInfo}
                className="sm:col-span-2"
              >
                <Textarea
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  rows={3}
                  placeholder="e.g. 1 × HP EliteBook 840 G8 from my order request…"
                />
              </Field>
              <Field
                label="Additional notes"
                hint="Preferred dates, landmarks, receiver's details…"
                className="sm:col-span-2"
              >
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything else we should know…"
                />
              </Field>
            </div>

            {submitError ? (
              <div className="mt-4">
                <Callout tone="warning">
                  <span className="font-semibold">{submitError}</span>
                </Callout>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner className="h-4 w-4" /> Sending…
                  </>
                ) : (
                  <>
                    <IconWhatsApp className="h-4 w-4" /> Send request via WhatsApp
                  </>
                )}
              </Button>
              <Link to="/cart" className="text-sm font-bold text-brand-700 hover:text-brand-800">
                ← Back to my order request
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Callout tone="info">
            <strong>How it works:</strong>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5">
              <li>Send this request with your details.</li>
              <li>Bikoom replies on WhatsApp with cost and timing.</li>
              <li>You agree, and your item is dispatched.</li>
            </ol>
          </Callout>
          <div className="rounded-2xl border border-ink-200/70 bg-white p-5 text-sm text-ink-600 shadow-sm">
            <p className="flex items-center gap-2 font-bold text-ink-900">
              <IconMapPin className="h-4 w-4 text-brand-600" />
              {brand.location}
            </p>
            <p className="mt-2 text-xs leading-relaxed">
              {brand.shortName} delivers from Ogoja to other states via trusted
              waybill partners. Photocopying and printing, however, are
              in-person services available <strong>in Ogoja only</strong>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
