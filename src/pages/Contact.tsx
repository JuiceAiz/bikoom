import { Link } from "react-router-dom";
import { brand, usesPlaceholderWhatsApp } from "../brand";
import {
  IconClock,
  IconMail,
  IconMapPin,
  IconTruck,
  IconWhatsApp,
} from "../components/icons";
import { Badge, Callout, buttonClass } from "../components/ui";
import { buildGeneralMessage, waLink } from "../lib/whatsapp";

const FAQ = [
  {
    q: "How do I pay for an order?",
    a: "There is no online checkout. You send your order request, then agree on the final price and payment directly with Bikoom on WhatsApp.",
  },
  {
    q: "Do you deliver outside Ogoja?",
    a: "Yes — request delivery or waybill and we'll arrange it with you. The delivery cost is discussed directly, never fixed on the website.",
  },
  {
    q: "Can I photocopy from anywhere?",
    a: "Photocopying, printing, binding and lamination are in-person services available in Ogoja only. Send your documents on WhatsApp and pick up the same day.",
  },
];

export default function Contact() {
  return (
    <div className="page-container py-10 sm:py-14">
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-ink-400" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-700">Home</Link>
        <span>/</span>
        <span className="text-ink-600">Contact</span>
      </nav>

      <div className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-950 sm:text-4xl">
          Talk to {brand.shortName}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          WhatsApp is the fastest way to reach us — that's where every price,
          order and delivery is confirmed. You can also visit or call when
          you're in Ogoja.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp-dark">
            <IconWhatsApp className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-bold text-ink-950">WhatsApp</h2>
          <p className="mt-1.5 flex-1 text-sm text-ink-500">
            Orders, prices, delivery and questions — we reply during shop
            hours.
          </p>
          <a
            href={waLink(buildGeneralMessage())}
            target="_blank"
            rel="noreferrer"
            className={buttonClass("whatsapp", "md", "mt-4")}
          >
            Start a chat
          </a>
          {usesPlaceholderWhatsApp ? (
            <p className="mt-2 text-[11px] font-medium text-amber-600">
              Demo number — set VITE_WHATSAPP_NUMBER in .env.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <IconMapPin className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-bold text-ink-950">Visit the shop</h2>
          <p className="mt-1.5 flex-1 text-sm text-ink-500">
            {brand.location}
            <br />
            {brand.hours}
          </p>
          <Link to="/delivery" className={buttonClass("outline", "md", "mt-4")}>
            <IconTruck className="h-4 w-4" /> Request delivery
          </Link>
        </div>

        <div className="flex flex-col rounded-2xl border border-ink-200/70 bg-white p-6 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <IconMail className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-bold text-ink-950">Email</h2>
          <p className="mt-1.5 flex-1 text-sm text-ink-500">
            For documents, invoices and formal requests.
          </p>
          <a
            href={`mailto:${brand.contactEmail}`}
            className={`${buttonClass("outline", "md")} mt-4 break-all`}
          >
            <IconClock className="h-4 w-4" /> {brand.contactEmail}
          </a>
        </div>
      </div>

      {/* Ogoja note */}
      <div className="mt-8">
        <Callout tone="info">
          <span className="font-semibold">Location note:</span> Bikoom operates
          from {brand.location}. Photocopying and printing are{" "}
          <strong>Ogoja-only</strong> services; laptops, phones, furniture and
          Starlink kits can be delivered to other locations on request.
        </Callout>
      </div>

      {/* FAQ */}
      <section className="mt-14">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-ink-950">
            Quick answers
          </h2>
          <Badge tone="brand">FAQ</Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-ink-200/70 bg-white p-5"
            >
              <h3 className="text-sm font-bold text-ink-900">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14 rounded-3xl bg-ink-950 px-6 py-10 text-center text-white sm:px-10">
        <h2 className="text-2xl font-extrabold">Prefer to just chat?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-300">
          Send {brand.shortName} a message with what you're looking for and
          we'll confirm price, stock and delivery for you.
        </p>
        <a
          href={waLink(buildGeneralMessage())}
          target="_blank"
          rel="noreferrer"
          className={`${buttonClass("whatsapp", "lg")} mt-6`}
        >
          <IconWhatsApp className="h-4 w-4" /> Message us on WhatsApp
        </a>
      </section>
    </div>
  );
}
