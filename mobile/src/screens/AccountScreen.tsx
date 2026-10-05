import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Badge, Button, Callout, useTopInset } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { brand, usesPlaceholderWhatsApp } from "../config";
import { colors, radius } from "../theme";

type Nav = NativeStackNavigationProp<Record<string, object | undefined>>;

export default function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const { session, profile, isAdmin, signOut, loading } = useAuth();
  const top = useTopInset();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14, ...top }}>
      {/* Identity */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          padding: 18,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              backgroundColor: colors.brand100,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "900", color: colors.brand700, fontSize: 18 }}>
              {(profile?.full_name ?? session?.user.email ?? "Guest")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "900", color: colors.ink950 }}>
              {profile?.full_name ?? (session ? session.user.email : "Guest")}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.ink500 }}>
              {session
                ? session.user.email
                : "Browsing without an account"}
            </Text>
            {isAdmin ? (
              <View style={{ marginTop: 4 }}>
                <Badge tone="green">Admin</Badge>
              </View>
            ) : null}
          </View>
        </View>

        {session ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              title="Sign out"
              variant="outline"
              size="sm"
              onPress={() => void signOut()}
            />
          </View>
        ) : (
          <Button
            title={loading ? "Checking…" : "Sign in with Google"}
            onPress={() => navigation.navigate("SignIn")}
            fullWidth
          />
        )}
      </View>

      {/* Admin */}
      {isAdmin ? (
        <Pressable
          onPress={() => navigation.navigate("Admin")}
          style={({ pressed }) => ({
            backgroundColor: colors.ink950,
            borderRadius: radius.lg,
            padding: 18,
            opacity: pressed ? 0.9 : 1,
            gap: 4,
          })}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: "900" }}>
              Admin dashboard
            </Text>
            <Text style={{ color: colors.brand200, fontWeight: "800" }}>Open →</Text>
          </View>
          <Text style={{ color: colors.ink400, fontSize: 13, lineHeight: 19 }}>
            Products, categories, banners and order/delivery requests — changes
            sync to the website instantly.
          </Text>
        </Pressable>
      ) : null}

      {/* Links */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          overflow: "hidden",
        }}
      >
        <Row label="Contact us" onPress={() => navigation.navigate("Contact")} />
        <Row
          label="Delivery / waybill request"
          onPress={() => navigation.navigate("DeliveryTab" as never)}
        />
        <Row label="Visit our website" value="bikoom.vercel.app" />
      </View>

      {usesPlaceholderWhatsApp ? (
        <Callout tone="warning">
          WhatsApp number is still the placeholder — set EXPO_PUBLIC_WHATSAPP_NUMBER
          before release.
        </Callout>
      ) : null}

      {/* About */}
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
        <Text style={{ fontWeight: "900", color: colors.ink950, fontSize: 15 }}>
          {brand.name}
        </Text>
        <Text style={{ fontSize: 13, color: colors.ink500, lineHeight: 20 }}>
          {brand.description}
        </Text>
        <Text style={{ fontSize: 12, color: colors.ink400, marginTop: 4 }}>
          {brand.hours} · {brand.location}
        </Text>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.ink100,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: pressed ? colors.ink50 : colors.white,
      })}
    >
      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink700 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: colors.ink400 }}>
        {value ?? "›"}
      </Text>
    </Pressable>
  );
}
