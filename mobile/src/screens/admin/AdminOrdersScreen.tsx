import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { OrderRequest, RequestStatus } from "../../../../shared/types";
import { REQUEST_STATUSES } from "../../../../shared/types";
import { Badge, Callout, Chips, EmptyState, Spinner } from "../../components/ui";
import { api } from "../../lib/api";
import { formatDate, formatNaira } from "../../lib/format";
import { useRealtimeRefresh } from "../../lib/realtime";
import { waLink, waNumberFromPhone } from "../../lib/whatsapp";
import { colors, radius } from "../../theme";

type Filter = "all" | RequestStatus;

const STATUS_TONE = {
  new: "blue",
  contacted: "amber",
  closed: "green",
} as const;

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoadState("loading");
    try {
      setOrders(await api.admin.orders());
      setLoadState("ready");
    } catch (err) {
      console.error("[admin/orders]", err);
      if (!silent) setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(["order_requests"], load);

  const visible = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const changeStatus = async (order: OrderRequest, status: RequestStatus) => {
    const previous = order.status;
    setUpdatingId(order.id);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
    try {
      const updated = await api.admin.updateOrderStatus(order.id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)),
      );
    } catch (err) {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: previous } : o)),
      );
      Alert.alert(
        "Could not update",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setUpdatingId(null);
    }
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
        <Callout tone="warning">Could not load order requests.</Callout>
        <Pressable onPress={() => void load()}>
          <Text style={{ color: colors.brand700, fontWeight: "800" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const counts = {
    all: orders.length,
    new: orders.filter((o) => o.status === "new").length,
    contacted: orders.filter((o) => o.status === "contacted").length,
    closed: orders.filter((o) => o.status === "closed").length,
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 14, paddingBottom: 48, gap: 12 }}
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
      <Chips
        options={[
          { value: "all", label: `All (${counts.all})` },
          { value: "new", label: `New (${counts.new})` },
          { value: "contacted", label: `Contacted (${counts.contacted})` },
          { value: "closed", label: `Closed (${counts.closed})` },
        ]}
        value={filter}
        onChange={(v) => setFilter(v as Filter)}
      />

      {visible.length === 0 ? (
        <EmptyState
          title="No order requests yet"
          description="When customers send their cart from the website or app, requests land here."
        />
      ) : (
        visible.map((order) => (
          <View
            key={order.id}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.ink200,
              padding: 14,
              gap: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "900", color: colors.ink950, fontSize: 15 }}>
                {order.customer_name}
              </Text>
              <Badge tone={STATUS_TONE[order.status]}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </View>
            <Text style={{ fontSize: 12, color: colors.ink500 }}>
              {formatDate(order.created_at)} ·{" "}
              {order.customer_location || "No location given"}
            </Text>

            {/* Items */}
            <View style={{ gap: 3 }}>
              {(order.items ?? []).map((item) => (
                <View
                  key={item.id}
                  style={{ flexDirection: "row", justifyContent: "space-between" }}
                >
                  <Text style={{ fontSize: 13, color: colors.ink700 }}>
                    <Text style={{ fontWeight: "900" }}>{item.quantity}×</Text>{" "}
                    {item.product_name}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: colors.ink500 }}>
                    {item.show_price && item.unit_price != null
                      ? formatNaira(Number(item.unit_price) * item.quantity)
                      : "on chat"}
                  </Text>
                </View>
              ))}
              {(order.items ?? []).length === 0 ? (
                <Text style={{ fontSize: 12, color: colors.ink400 }}>
                  No items recorded.
                </Text>
              ) : null}
            </View>

            {order.displayed_total != null ? (
              <Text style={{ fontSize: 13, fontWeight: "900", color: colors.ink950 }}>
                Displayed total: {formatNaira(order.displayed_total)}
              </Text>
            ) : null}

            <View style={{ gap: 3 }}>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: "900",
                  color: colors.ink400,
                  letterSpacing: 0.6,
                }}
              >
                CONTACT
              </Text>
              <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.ink700 }}>
                {order.customer_phone}
              </Text>
              {order.notes ? (
                <Text
                  style={{
                    fontSize: 12.5,
                    color: colors.ink600,
                    backgroundColor: colors.ink50,
                    borderRadius: radius.sm,
                    padding: 8,
                    marginTop: 4,
                  }}
                >
                  {order.notes}
                </Text>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Pressable
                disabled={updatingId === order.id}
                onPress={() => {
                  void Linking.openURL(
                    waLink(
                      `Hello ${order.customer_name}, this is Bikoom Stores replying to your order request from the website. Let's confirm your items, final prices and delivery.`,
                      waNumberFromPhone(order.customer_phone),
                    ),
                  );
                }}
                style={{
                  backgroundColor: colors.whatsappDark,
                  borderRadius: radius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  opacity: updatingId === order.id ? 0.6 : 1,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>
                  Reply on WhatsApp
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
              {REQUEST_STATUSES.map((status) => {
                const active = order.status === status;
                return (
                  <Pressable
                    key={status}
                    disabled={updatingId === order.id}
                    onPress={() => void changeStatus(order, status)}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: active ? colors.brand600 : colors.ink200,
                      backgroundColor: active ? colors.brand50 : colors.white,
                      borderRadius: radius.md,
                      paddingVertical: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: active ? colors.brand700 : colors.ink500,
                      }}
                    >
                      {STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
