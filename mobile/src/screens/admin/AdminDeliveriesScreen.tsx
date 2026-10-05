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

import type { DeliveryRequest, RequestStatus } from "../../../../shared/types";
import { REQUEST_STATUSES } from "../../../../shared/types";
import { Badge, Callout, Chips, EmptyState, Spinner } from "../../components/ui";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/format";
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

export default function AdminDeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoadState("loading");
    try {
      setDeliveries(await api.admin.deliveries());
      setLoadState("ready");
    } catch (err) {
      console.error("[admin/deliveries]", err);
      if (!silent) setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(["delivery_requests"], load);

  const visible = useMemo(
    () =>
      filter === "all"
        ? deliveries
        : deliveries.filter((d) => d.status === filter),
    [deliveries, filter],
  );

  const changeStatus = async (delivery: DeliveryRequest, status: RequestStatus) => {
    const previous = delivery.status;
    setUpdatingId(delivery.id);
    setDeliveries((prev) =>
      prev.map((d) => (d.id === delivery.id ? { ...d, status } : d)),
    );
    try {
      const updated = await api.admin.updateDeliveryStatus(delivery.id, status);
      setDeliveries((prev) =>
        prev.map((d) => (d.id === delivery.id ? { ...d, ...updated } : d)),
      );
    } catch (err) {
      setDeliveries((prev) =>
        prev.map((d) => (d.id === delivery.id ? { ...d, status: previous } : d)),
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
        <Callout tone="warning">Could not load delivery requests.</Callout>
        <Pressable onPress={() => void load()}>
          <Text style={{ color: colors.brand700, fontWeight: "800" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const counts = {
    all: deliveries.length,
    new: deliveries.filter((d) => d.status === "new").length,
    contacted: deliveries.filter((d) => d.status === "contacted").length,
    closed: deliveries.filter((d) => d.status === "closed").length,
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
          title="No delivery requests yet"
          description="Waybill and delivery requests from customers appear here instantly."
        />
      ) : (
        visible.map((delivery) => (
          <View
            key={delivery.id}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.ink200,
              padding: 14,
              gap: 7,
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
                {delivery.name}
              </Text>
              <Badge tone={STATUS_TONE[delivery.status]}>
                {STATUS_LABELS[delivery.status]}
              </Badge>
            </View>
            <Text style={{ fontSize: 12.5, color: colors.ink600 }}>
              🚚 {delivery.location} · {formatDate(delivery.created_at)}
            </Text>
            <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.ink700 }}>
              {delivery.phone}
            </Text>
            <View>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: "900",
                  color: colors.ink400,
                  letterSpacing: 0.6,
                }}
              >
                PRODUCT / ORDER
              </Text>
              <Text style={{ fontSize: 13, color: colors.ink700, marginTop: 2 }}>
                {delivery.product_info}
              </Text>
            </View>
            {delivery.notes ? (
              <Text
                style={{
                  fontSize: 12.5,
                  color: colors.ink600,
                  backgroundColor: colors.ink50,
                  borderRadius: radius.sm,
                  padding: 8,
                }}
              >
                {delivery.notes}
              </Text>
            ) : null}

            <Pressable
              disabled={updatingId === delivery.id}
              onPress={() => {
                void Linking.openURL(
                  waLink(
                    `Hello ${delivery.name}, this is Bikoom Stores replying to your delivery/waybill request. Let's confirm the cost and timeline.`,
                    waNumberFromPhone(delivery.phone),
                  ),
                );
              }}
              style={{
                backgroundColor: colors.whatsappDark,
                borderRadius: radius.md,
                paddingHorizontal: 14,
                paddingVertical: 9,
                alignSelf: "flex-start",
                opacity: updatingId === delivery.id ? 0.6 : 1,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>
                Reply on WhatsApp
              </Text>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
              {REQUEST_STATUSES.map((status) => {
                const active = delivery.status === status;
                return (
                  <Pressable
                    key={status}
                    disabled={updatingId === delivery.id}
                    onPress={() => void changeStatus(delivery, status)}
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
