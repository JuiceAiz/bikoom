import { useNavigation } from "@react-navigation/native";
import { Linking, ScrollView, Text, View } from "react-native";

import { brand } from "../config";
import { Button } from "../components/ui";
import { buildGeneralMessage, waLink } from "../lib/whatsapp";
import { colors, radius } from "../theme";

export default function ContactScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}>
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          padding: 18,
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.ink950 }}>
          Talk to Bikoom
        </Text>
        <Text style={{ fontSize: 14, color: colors.ink600, lineHeight: 21 }}>
          WhatsApp is the fastest way to reach us — that's where every price,
          order and delivery is confirmed. You can also visit or call when you're
          in Ogoja.
        </Text>
        <View style={{ marginTop: 8, gap: 10 }}>
          <Button
            title="Chat on WhatsApp"
            variant="whatsapp"
            fullWidth
            size="lg"
            onPress={() => void Linking.openURL(waLink(buildGeneralMessage()))}
          />
          <Button
            title="Send an order request"
            variant="outline"
            fullWidth
            onPress={() => navigation.navigate("CartTab" as never)}
          />
        </View>
      </View>

      <InfoRow icon="📍" title="Visit us" value={brand.location} />
      <InfoRow icon="✉️" title="E-mail" value={brand.contactEmail} />
      <InfoRow icon="🕗" title="Hours" value={brand.hours} />
      <InfoRow icon="🚚" title="Delivery" value="Anywhere discussed directly on WhatsApp — no fixed prices." />
    </ScrollView>
  );
}

function InfoRow({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.ink200,
        padding: 16,
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: colors.ink400,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink700, marginTop: 2 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}
