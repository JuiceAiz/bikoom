import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { Badge, Callout, Spinner } from "../../components/ui";
import { api, type AdminStats } from "../../lib/api";
import { formatDate, formatNaira } from "../../lib/format";
import { useRealtimeRefresh } from "../../lib/realtime";
import { colors, radius } from "../../theme";
import type { AdminStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<AdminStackParamList>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setError(null);
    try {
      setStats(await api.admin.stats());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load stats.";
      if (!silent) setError(message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(
    ["products", "order_requests", "delivery_requests"],
    load,
  );

  if (!stats && !error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}
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
      {error ? (
        <Callout tone="warning">
          <Text style={{ fontWeight: "700" }}>{error}</Text>
        </Callout>
      ) : null}

      <Text style={{ fontSize: 14, color: colors.ink500 }}>
        Everything happening in your store at a glance.
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <StatCard label="Products" value={stats?.products ?? 0} onPress={() => navigation.navigate("AdminProducts")} />
        <StatCard label="Categories" value={stats?.categories ?? 0} onPress={() => navigation.navigate("AdminCategories")} />
        <StatCard label="Order requests" value={stats?.orders ?? 0} onPress={() => navigation.navigate("AdminOrders")} />
        <StatCard label="Delivery requests" value={stats?.deliveries ?? 0} onPress={() => navigation.navigate("AdminDeliveries")} />
      </View>

      {(stats?.outOfStock ?? 0) > 0 ? (
        <Pressable onPress={() => navigation.navigate("AdminProducts")}>
          <Callout tone="warning">
            {stats?.outOfStock} product{stats?.outOfStock === 1 ? " is" : "s are"}{" "}
            marked out of stock.
          </Callout>
        </Pressable>
      ) : null}

      {/* Quick actions */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <QuickAction label="＋ Add product" onPress={() => navigation.navigate("AdminProductForm", {})} />
        <QuickAction label="🏷 Manage banners" onPress={() => navigation.navigate("AdminBanners")} />
      </View>

      {/* Recent orders */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          padding: 16,
          gap: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: colors.ink950 }}>
            Recent order requests
          </Text>
          <Pressable onPress={() => navigation.navigate("AdminOrders")}>
            <Text style={{ color: colors.brand700, fontWeight: "800", fontSize: 13 }}>
              View all →
            </Text>
          </Pressable>
        </View>

        {(stats?.recentOrders ?? []).length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.ink500 }}>
            No order requests yet. They'll appear here as customers send their
            carts — from the website or the app.
          </Text>
        ) : (
          (stats?.recentOrders ?? []).map((order) => (
            <View
              key={order.id}
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.ink100,
                paddingTop: 8,
                gap: 2,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "800", color: colors.ink950, fontSize: 14 }}>
                  {order.customer_name}
                </Text>
                <Badge
                  tone={
                    order.status === "new"
                      ? "blue"
                      : order.status === "contacted"
                        ? "amber"
                        : "green"
                  }
                >
                  {order.status}
                </Badge>
              </View>
              <Text style={{ fontSize: 12, color: colors.ink500 }}>
                {formatDate(order.created_at)}
                {order.displayed_total != null
                  ? ` · ${formatNaira(order.displayed_total)}`
                  : ""}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: "47%",
        flexGrow: 1,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.ink200,
        padding: 16,
        opacity: pressed ? 0.85 : 1,
        gap: 2,
      })}
    >
      <Text style={{ fontSize: 26, fontWeight: "900", color: colors.brand700 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.ink500 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: colors.brand50,
        borderColor: colors.brand200,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingVertical: 12,
        alignItems: "center",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ fontWeight: "800", color: colors.brand700, fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}
