import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { Product } from "../../../shared/types";
import { ProductCard } from "../components/ProductCard";
import { ProductImage } from "../components/ProductImage";
import { Badge, Button, Callout, Spinner } from "../components/ui";
import { useCart } from "../context/CartContext";
import { formatNaira } from "../lib/format";
import { useRealtimeRefresh } from "../lib/realtime";
import { requireSupabase } from "../lib/supabase";
import { productChatLink } from "../lib/whatsapp";
import { colors, radius } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Product">;
type LoadState = "loading" | "ready" | "error";

export default function ProductScreen({ route, navigation }: Props) {
  const { slug } = route.params;
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoadState("loading");
      try {
        const supabase = requireSupabase();
        const { data, error } = await supabase
          .from("products")
          .select("*, category:categories(id, name, slug)")
          .eq("slug", slug)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setLoadState("error");
          setProduct(null);
          return;
        }
        setProduct(data as Product);
        setLoadState("ready");
        if (data.category_id) {
          const { data: relatedData } = await supabase
            .from("products")
            .select("*, category:categories(id, name, slug)")
            .eq("category_id", data.category_id)
            .neq("id", data.id)
            .limit(4);
          setRelated((relatedData ?? []) as Product[]);
        }
      } catch (err) {
        console.error("[product]", err);
        if (!silent) setLoadState("error");
      }
    },
    [slug],
  );

  useEffect(() => {
    void load();
    setQuantity(1);
    setAdded(false);
  }, [load]);

  useRealtimeRefresh(["products"], load);

  if (loadState === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Spinner size="large" />
      </View>
    );
  }

  if (loadState === "error" || !product) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 14 }}>
        <Callout tone="warning">
          This product could not be found. It may have been removed.
        </Callout>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
        ? [product.image_url]
        : [];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ height: 280, backgroundColor: colors.ink100 }}>
        <ProductImage name={product.name} src={images[0] ?? null} rounded={0} />
      </View>

      <View style={{ padding: 20, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          {product.category ? <Badge tone="blue">{product.category.name}</Badge> : null}
          {product.is_featured ? <Badge tone="amber">Featured</Badge> : null}
          {!product.is_available ? <Badge tone="red">Out of stock</Badge> : null}
        </View>

        <Text style={{ fontSize: 24, fontWeight: "900", color: colors.ink950 }}>
          {product.name}
        </Text>

        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.brand700 }}>
          {product.show_price ? formatNaira(product.price) : "Contact for Price"}
        </Text>

        <Text style={{ fontSize: 14.5, lineHeight: 22, color: colors.ink600 }}>
          {product.description}
        </Text>

        {/* Quantity + add to cart */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            marginTop: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.ink200,
              backgroundColor: colors.white,
            }}
          >
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink600 }}>
                −
              </Text>
            </Pressable>
            <Text
              style={{
                minWidth: 32,
                textAlign: "center",
                fontWeight: "800",
                color: colors.ink950,
              }}
            >
              {quantity}
            </Text>
            <Pressable
              onPress={() => setQuantity((q) => Math.min(99, q + 1))}
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink600 }}>
                +
              </Text>
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            <Button
              title={added ? "Added ✓" : "Add to order request"}
              onPress={() => {
                if (!product.is_available) return;
                add(product, quantity);
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
              }}
              disabled={!product.is_available}
              fullWidth
              size="lg"
            />
          </View>
        </View>

        <Button
          title="Ask on WhatsApp"
          variant="whatsapp"
          fullWidth
          size="lg"
          onPress={() => void Linking.openURL(productChatLink(product.name))}
        />

        <Callout tone="info">
          Picked up in Ogoja, or delivered anywhere — delivery cost discussed
          directly on WhatsApp. {product.is_available ? "" : "This item is currently out of stock."}
        </Callout>
      </View>

      {related.length > 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{ fontSize: 17, fontWeight: "900", color: colors.ink950 }}
          >
            More in {product.category?.name ?? "this category"}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 12,
            }}
          >
            {related.map((item) => (
              <View key={item.id} style={{ width: "47%", flexGrow: 1 }}>
                <ProductCard product={item} />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
