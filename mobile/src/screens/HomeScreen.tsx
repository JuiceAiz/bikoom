import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { Banner, Category, Product } from "../../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { Button, Callout, Spinner } from "../components/ui";
import { brand } from "../config";
import { formatNaira } from "../lib/format";
import { useRealtimeRefresh } from "../lib/realtime";
import { requireSupabase } from "../lib/supabase";
import { buildGeneralMessage, waLink } from "../lib/whatsapp";
import { colors, radius } from "../theme";

type Nav = NativeStackNavigationProp<Record<string, object | undefined>>;
type LoadState = "loading" | "ready" | "error";

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState("loading");
    try {
      const supabase = requireSupabase();
      const [bannerRes, categoryRes, productRes] = await Promise.all([
        supabase
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase.from("categories").select("*").order("sort_order"),
        supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .order("created_at", { ascending: false })
          .limit(16),
      ]);
      const firstError =
        bannerRes.error ?? categoryRes.error ?? productRes.error;
      if (firstError) throw firstError;
      setBanners((bannerRes.data ?? []) as Banner[]);
      setCategories((categoryRes.data ?? []) as Category[]);
      setProducts((productRes.data ?? []) as Product[]);
      setState("ready");
    } catch (err) {
      console.error("[home]", err);
      if (!silent) setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live updates: any change on the site refreshes this screen instantly.
  useRealtimeRefresh(["products", "categories", "banners"], load);

  // Rotate hero banners.
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (state === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Spinner size="large" />
      </View>
    );
  }

  if (state === "error") {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 14 }}>
        <Callout tone="warning">
          Could not load the store. Check your connection and pull to retry.
        </Callout>
        <Button title="Try again" onPress={() => void load()} />
      </View>
    );
  }

  const hero = banners[bannerIndex] ?? banners[0];
  const featured = products.filter((p) => p.is_featured).slice(0, 8);
  const shownFeatured = featured.length > 0 ? featured : products.slice(0, 8);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing > 0}
          onRefresh={() => {
            setRefreshing(1);
            void load(true).finally(() => setRefreshing(0));
          }}
          tintColor={colors.brand600}
        />
      }
    >
      {/* Hero */}
      <View
        style={{
          backgroundColor: colors.ink950,
          padding: 24,
          paddingTop: 56,
          paddingBottom: 40,
          overflow: "hidden",
        }}
      >
        {hero?.image_url ? (
          <ProductImage
            name=""
            src={hero.image_url}
            rounded={0}
            style={{ position: "absolute", opacity: 0.3 }}
          />
        ) : null}
        <View style={{ gap: 14 }}>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: colors.brand200, fontSize: 12, fontWeight: "700" }}>
              📍 {brand.location}
            </Text>
          </View>
          <Text
            style={{
              color: colors.white,
              fontSize: 30,
              fontWeight: "900",
              lineHeight: 36,
            }}
          >
            {hero?.title ?? brand.tagline}
          </Text>
          <Text style={{ color: colors.ink300, fontSize: 15, lineHeight: 22 }}>
            {hero?.subtitle ??
              "New and A1 London-used office equipment, furniture, Starlink installation and services — with every order confirmed with you personally on WhatsApp."}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <Button
              title="Browse the shop"
              onPress={() => navigation.navigate("ShopTab" as never)}
            />
            <Button
              title="Chat on WhatsApp"
              variant="outline"
              onPress={() =>
                void Linking.openURL(waLink(buildGeneralMessage()))
              }
            />
          </View>
          {banners.length > 1 ? (
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              {banners.map((b, i) => (
                <View
                  key={b.id}
                  style={{
                    width: i === bannerIndex ? 18 : 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor:
                      i === bannerIndex ? colors.brand500 : colors.ink700,
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Categories */}
      <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
        <Text style={sectionTitle}>Shop by category</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() =>
                navigation.navigate("ShopTab", { category: category.slug } as never)
              }
              style={{
                backgroundColor: colors.white,
                borderColor: colors.ink200,
                borderWidth: 1,
                borderRadius: radius.full,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontWeight: "700", color: colors.ink700, fontSize: 13 }}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Featured */}
      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={sectionTitle}>Featured picks</Text>
          <Pressable onPress={() => navigation.navigate("ShopTab" as never)}>
            <Text style={{ color: colors.brand700, fontWeight: "800", fontSize: 13 }}>
              See all →
            </Text>
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 12,
          }}
        >
          {shownFeatured.map((product) => (
            <View key={product.id} style={{ width: "47%", flexGrow: 1 }}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      </View>

      {/* Services strip */}
      <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <View
          style={{
            backgroundColor: colors.brand50,
            borderRadius: radius.xl,
            padding: 20,
            gap: 10,
            borderWidth: 1,
            borderColor: colors.brand200,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "900", color: colors.brand950 }}>
            Services in Ogoja
          </Text>
          <Text style={{ fontSize: 13.5, color: colors.brand700, lineHeight: 20 }}>
            Photocopying, printing, spiral binding &amp; lamination, laptop
            servicing, Wi-Fi setup and Starlink installation — discussed and
            confirmed on WhatsApp.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              title="Request a service"
              size="sm"
              onPress={() =>
                void Linking.openURL(
                  waLink(
                    buildGeneralMessage(
                      "I'd like to ask about one of your services.",
                    ),
                  ),
                )
              }
            />
            <Button
              title="Contact us"
              size="sm"
              variant="outline"
              onPress={() => navigation.navigate("Contact")}
            />
          </View>
        </View>
      </View>

      {/* Prices note */}
      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        <Callout tone="info">
          Prices shown are displayed prices — final pricing, availability and
          delivery are always confirmed with you on WhatsApp. Cheapest item
          today: {cheapest(shownFeatured)}.
        </Callout>
      </View>
    </ScrollView>
  );
}

const sectionTitle = {
  fontSize: 19,
  fontWeight: "900" as const,
  color: colors.ink950,
};

function cheapest(products: Product[]): string {
  const priced = products
    .filter((p) => p.show_price && p.price != null)
    .map((p) => ({ p, n: Number(p.price) }))
    .sort((a, b) => a.n - b.n);
  if (priced.length === 0) return "chat with us for prices";
  return `${priced[0].p.name} (${formatNaira(priced[0].n)})`;
}
