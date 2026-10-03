import { Outlet } from "react-router-dom";
import { brand } from "../brand";
import { buildGeneralMessage, waLink } from "../lib/whatsapp";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { IconWhatsApp } from "./icons";

export function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Floating WhatsApp CTA */}
      <a
        href={waLink(buildGeneralMessage())}
        target="_blank"
        rel="noreferrer"
        aria-label={`Chat with ${brand.shortName} on WhatsApp`}
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-xl shadow-black/20 transition hover:scale-105 hover:bg-whatsapp-dark"
      >
        <IconWhatsApp className="h-7 w-7" />
      </a>
    </div>
  );
}
