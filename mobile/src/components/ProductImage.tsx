import {
  Image,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { initials } from "../lib/format";
import { colors, radius } from "../theme";

export function ProductImage({
  name,
  src,
  style,
  rounded = radius.md,
}: {
  name: string;
  src?: string | null;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
}) {
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[
          { width: "100%", height: "100%", borderRadius: rounded },
          style as StyleProp<ImageStyle>,
        ]}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={[
        {
          width: "100%",
          height: "100%",
          borderRadius: rounded,
          backgroundColor: colors.brand100,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ fontWeight: "800", color: colors.brand700, fontSize: 18 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
