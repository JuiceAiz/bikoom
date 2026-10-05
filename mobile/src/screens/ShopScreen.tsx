import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Category, Product } from "../../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { Button, Callout, Chips, EmptyState, Spinner, useTopInset } from "../components/ui";
import { useRealtimeRefresh } from "../lib/realtime";
import { requireSupabase } from "../lib/supabase";
import { colors, radius } from "../theme";

type Props = {
  route: { params?: { category?: string } };
  navigation: { setParams: (params: { category?: string }) => void };
};

type LoadState = "loading" | "ready" | "error";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "az", label: "Name A–Z" },
  { value: "priceAsc", label: "Price ↑" },
  { value: "priceDesc", label: "Price ↓" },
];

export default function ShopScreen({ route, navigation }: Props) {
  const categorySlug = route.params?.category ?? "";
  const top = useTopInset();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [query, setQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoadState("loading");
    try {
      const supabase = requireSupabase();
      const [productRes, categoryRes] = await Promise.all([
        supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
      if (productRes.error) throw productRes.error;
      if (categoryRes.error) throw categoryRes.error;
      setProducts((productRes.data ?? []) as Product[]);
      setCategories((categoryRes.data ?? []) as Category[]);
      setLoadState("ready");
    } catch (err) {
      console.error("[shop]", err);
      if (!silent) setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(["products", "categories"], load);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    let list = products.filter((product) => {
      if (categorySlug && product.category?.slug !== categorySlug) return false;
      if (inStockOnly && !product.is_available) return false;
      if (search) {
        const haystack =
          `${product.name} ${product.description} ${product.category?.name ?? ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
    list = [...list];
    if (sort === "az") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "priceAsc" || sort === "priceDesc") {
      const value = (p: Product) => (p.price == null ? Infinity : Number(p.price));
      list.sort((a, b) =>
        sort === "priceAsc" ? value(a) - value(b) : value(b) - value(a),
      );
    }
    return list;
  }, [products, categorySlug, inStockOnly, query, sort]);

  if (loadState === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Spinner size="large" />
      </View>
    );
  }

  if (loadState === "error") {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 14 }}>
        <Callout tone="warning">Could not load products.</Callout>
        <Button title="Try again" onPress={() => void load()} />
      </View>
    );
  }

  const categoryOptions = [
    { value: "", label: "All" },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40, ...top }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load(true).finally(() => setRefreshing(false));
          }}
          tintColor={colors.brand600}
        />
      }
    >
      <Text style={{ fontSize: 24, fontWeight: "900", color: colors.ink950 }}>
        {categories.find((c) => c.slug === categorySlug)?.name ?? "Shop"}
      </Text>
      <Text style={{ fontSize: 13, color: colors.ink500, marginTop: 4 }}>
        Browse every product from Bikoom Stores. Final pricing is confirmed on
        WhatsApp.
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search products…"
        placeholderTextColor={colors.ink400}
        style={{
          marginTop: 14,
          borderWidth: 1,
          borderColor: colors.ink200,
          backgroundColor: colors.white,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: 15,
          color: colors.ink950,
        }}
      />

      <View style={{ marginTop: 12, gap: 10 }}>
        <Chips
          options={categoryOptions}
          value={categorySlug}
          onChange={(slug) =>
            navigation.setParams({ category: slug || undefined })
          }
        />
        <Chips options={SORTS} value={sort} onChange={setSort} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.white,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.ink200,
            paddingHorizontal: 12,
            paddingVertical: 6,
            alignSelf: "flex-start",
          }}
        >
          <Switch
            value={inStockOnly}
            onValueChange={setInStockOnly}
            trackColor={{ false: colors.ink300, true: colors.brand500 }}
            thumbColor={colors.white}
          />
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink600 }}>
            In stock only
          </Text>
        </View>
      </View>

      <Text style={{ marginTop: 14, fontSize: 12.5, color: colors.ink500 }}>
        {visible.length} product{visible.length === 1 ? "" : "s"}
      </Text>

      {visible.length === 0 ? (
        <EmptyState
          title="No products match"
          description="Try a different search or clear the filters."
        />
      ) : (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 12,
          }}
        >
          {visible.map((product) => (
            <View key={product.id} style={{ width: "47%", flexGrow: 1 }}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
