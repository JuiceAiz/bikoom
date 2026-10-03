import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { HealthResponse } from "../shared/types";
import { AdminRoute } from "./components/AdminRoute";
import { StoreLayout } from "./components/StoreLayout";
import { Logo } from "./components/Logo";
import { Button, Spinner } from "./components/ui";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { api } from "./lib/api";
import { missingClientEnv, supabaseConfigured } from "./lib/supabaseClient";
import AuthCallback from "./pages/AuthCallback";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";
import Delivery from "./pages/Delivery";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import SetupRequired from "./pages/SetupRequired";
import Shop from "./pages/Shop";
import SignIn from "./pages/SignIn";
import { AdminBanners } from "./pages/admin/Banners";
import { AdminCategories } from "./pages/admin/Categories";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminDeliveries } from "./pages/admin/Deliveries";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOrders } from "./pages/admin/Orders";
import { AdminProductForm } from "./pages/admin/ProductForm";
import { AdminProducts } from "./pages/admin/Products";

type BootState = "loading" | "ready" | "unconfigured" | "error";

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream">
      <Logo />
      <Spinner className="h-6 w-6 text-brand-600" />
    </div>
  );
}

function BootError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <h1 className="text-xl font-extrabold text-ink-950">
        Can't reach the Bikoom API
      </h1>
      <p className="max-w-md text-sm text-ink-500">
        The server process isn't running or failed to start. If you haven't
        yet, run <code className="rounded bg-ink-100 px-1.5 py-0.5">npm run dev</code>{" "}
        and check the API terminal for errors.
      </p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [state, setState] = useState<BootState>("loading");

  const check = useCallback(() => {
    setState("loading");
    api
      .health()
      .then((h) => {
        setHealth(h);
        setState(h.configured && supabaseConfigured ? "ready" : "unconfigured");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(check, [check]);

  if (state === "loading") return <Splash />;
  if (state === "error") return <BootError onRetry={check} />;
  if (state === "unconfigured") {
    return (
      <SetupRequired
        health={health}
        clientMissing={missingClientEnv}
        onRetry={check}
      />
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* The storefront is public: browse without signing in.
                Sign-in stays optional for orders; admin still requires it. */}
            <Route element={<StoreLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/category/:slug" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/delivery" element={<Delivery />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id" element={<AdminProductForm />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
