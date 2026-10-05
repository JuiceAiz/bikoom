import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Product } from "../../../../shared/types";
import { ProductImage } from "../../components/ProductImage";
import { Badge, Callout, EmptyState, Spinner } from "../../components/ui";
import { api } from "../../lib/api";
import { formatNaira } from "../../lib/format";
import { useRealtimeRefresh } from "../../lib/realtime";
import { colors, radius } from "../../theme";
import type { AdminStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<AdminStackParamList>;

export default function AdminProductsScreen() {
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoadState("loading");
    try {
      setProducts(await api.admin.products());
      setLoadState("ready");
    } catch (err) {
      console.error("[admin/products]", err);
      if (!silent) setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(["products"], load);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products;
    return products.filter((p) =>
      `${p.name} ${p.description}`.toLowerCase().includes(search),
    );
  }, [products, query]);

  const toggleAvailable = async (product: Product) => {
    const next = !product.is_available;
    // Optimistic update — rollback on failure.
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_available: next } : p)),
    );
    try {
      await api.admin.updateProduct(product.id, {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: product.category_id,
        price: product.price != null ? Number(product.price) : null,
        showPrice: product.show_price,
        isAvailable: next,
        isFeatured: product.is_featured,
        imageUrl: product.image_url,
      });
    } catch (err) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: !next } : p)),
      );
      Alert.alert("Could not update", err instanceof Error ? err.message : String(err));
    }
  };

  const confirmDelete = (product: Product) => {
    Alert.alert(
      `Delete "${product.name}"?`,
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void api.admin
              .deleteProduct(product.id)
              .then(() =>
                setProducts((prev) => prev.filter((p) => p.id !== product.id)),
              )
              .catch((err: unknown) =>
                Alert.alert(
                  "Could not delete",
                  err instanceof Error ? err.message : String(err),
                ),
              );
          },
        },
      ],
    );
  };

  if (loadState === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Spinner size="large" />
      </View>
    );
  }

  if (loadState === "error") {
    return (
      <View style={{ flex: 1, padding: 20, gap: 14 }}>
        <Callout tone="warning">Could not load products.</Callout>
        <Pressable onPress={() => void load()}>
          <Text style={{ color: colors.brand700, fontWeight: "800" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          padding: 14,
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.ink200,
          alignItems: "center",
        }}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products"
          placeholderTextColor={colors.ink400}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.ink200,
            borderRadius: radius.md,
            paddingHorizontal: 12,
            paddingVertical: 9,
            fontSize: 14,
            color: colors.ink950,
            backgroundColor: colors.ink50,
          }}
        />
        <Pressable
          onPress={() => navigation.navigate("AdminProductForm", {})}
          style={{
            backgroundColor: colors.brand600,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>
            ＋ Add
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40, gap: 10 }}
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
        {visible.length === 0 ? (
          <EmptyState title="No products match" />
        ) : (
          visible.map((product) => (
            <View
              key={product.id}
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.ink200,
                padding: 12,
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
              <View style={{ width: 56, height: 52 }}>
                <ProductImage name={product.name} src={product.image_url} />
              </View>
              <Pressable
                onPress={() =>
                  navigation.navigate("AdminProductForm", { id: product.id })
                }
                style={{ flex: 1 }}
              >
                <Text
                  numberOfLines={1}
                  style={{ fontWeight: "800", color: colors.ink950, fontSize: 14 }}
                >
                  {product.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 3,
                  }}
                >
                  <Text style={{ fontSize: 12.5, color: colors.ink600 }}>
                    {product.show_price ? formatNaira(product.price) : "Contact"}
                  </Text>
                  {!product.is_available ? <Badge tone="red">Out</Badge> : null}
                  {product.is_featured ? <Badge tone="amber">Featured</Badge> : null}
                </View>
              </Pressable>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Switch
                  value={product.is_available}
                  onValueChange={() => void toggleAvailable(product)}
                  trackColor={{ false: colors.ink300, true: colors.brand500 }}
                  thumbColor={colors.white}
                />
                <Pressable onPress={() => confirmDelete(product)} hitSlop={6}>
                  <Text style={{ color: colors.red, fontWeight: "800", fontSize: 12 }}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
