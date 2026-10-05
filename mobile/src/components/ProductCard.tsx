import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";

import type { Product } from "../../../shared/types";
import { formatNaira } from "../lib/format";
import { colors, radius } from "../theme";
import { ProductImage } from "./ProductImage";
import { Badge } from "./ui";

type Nav = NativeStackNavigationProp<Record<string, object | undefined>>;

export function ProductCard({ product }: { product: Product }) {
  const navigation = useNavigation<Nav>();

  return (
    <Pressable
      onPress={() => navigation.navigate("Product", { slug: product.slug })}
      style={({ pressed }) => ({
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.ink200,
        overflow: "hidden",
        opacity: pressed ? 0.9 : 1,
        flex: 1,
      })}
    >
      <View style={{ height: 130, backgroundColor: colors.ink100 }}>
        <ProductImage name={product.name} src={product.image_url} rounded={0} />
      </View>
      <View style={{ padding: 10, gap: 4 }}>
        <Text
          numberOfLines={2}
          style={{ fontSize: 13, fontWeight: "800", color: colors.ink950, minHeight: 34 }}
        >
          {product.name}
        </Text>
        <Text style={{ fontSize: 11, color: colors.ink500 }}>
          {product.category?.name ?? "General"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: colors.brand700 }}>
            {product.show_price ? formatNaira(product.price) : "Contact for Price"}
          </Text>
          {!product.is_available ? <Badge tone="red">Out</Badge> : null}
        </View>
      </View>
    </Pressable>
  );
}
