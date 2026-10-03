import { Link } from "react-router-dom";
import { brand } from "../brand";
import { waLink, buildGeneralMessage } from "../lib/whatsapp";
import { Logo } from "./Logo";
import { IconMail, IconMapPin, IconPhone, IconWhatsApp } from "./icons";

const SHOP_LINKS = [
  { to: "/shop?category=laptops", label: "Laptops" },
  { to: "/shop?category=phones", label: "Phones" },
  { to: "/shop?category=furniture", label: "Furniture" },
  { to: "/shop?category=starlink", label: "Starlink" },
  { to: "/shop?category=services", label: "Services" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="page-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo tone="light" />
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            {brand.description}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Shop
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SHOP_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition hover:text-brand-300">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/shop" className="transition hover:text-brand-300">
                All products
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Services
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>Starlink installation</li>
            <li>Photocopying &amp; printing (Ogoja only)</li>
            <li>Spiral binding &amp; lamination</li>
            <li>Laptop servicing</li>
            <li>
              <Link to="/delivery" className="transition hover:text-brand-300">
                Delivery / waybill request
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>{brand.location}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <IconPhone className="h-4 w-4 shrink-0 text-brand-400" />
              <a href={waLink(buildGeneralMessage())} target="_blank" rel="noreferrer" className="transition hover:text-brand-300">
                Chat on WhatsApp
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <IconMail className="h-4 w-4 shrink-0 text-brand-400" />
              <a href={`mailto:${brand.contactEmail}`} className="transition hover:text-brand-300">
                {brand.contactEmail}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <IconWhatsApp className="h-4 w-4 shrink-0 text-brand-400" />
              <span>{brand.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="page-container flex flex-col gap-2 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {brand.name}. All rights reserved.</p>
          <p>
            Photocopying available in Ogoja only · Delivery costs discussed
            directly on WhatsApp
          </p>
        </div>
      </div>
    </footer>
  );
}
