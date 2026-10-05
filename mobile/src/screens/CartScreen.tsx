import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { api } from "../lib/api";
import { Button, Callout, EmptyState, Field, Input, Spinner, Textarea, useTopInset } from "../components/ui";
import { ProductImage } from "../components/ProductImage";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatNaira } from "../lib/format";
import { buildOrderMessage, waLink } from "../lib/whatsapp";
import { colors, radius } from "../theme";

export default function CartScreen() {
  const navigation = useNavigation();
  const { items, count, pricedTotal, hasContactForPrice, setQuantity, remove, clear, ready } =
    useCart();
  const top = useTopInset();
  const { profile } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setName((current) => current || profile.full_name || "");
  }, [profile]);

  const validate = (): boolean => {
    const next: { name?: string; phone?: string } = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (phone.replace(/[^\d+]/g, "").length < 7)
      next.phone = "Enter a valid phone / WhatsApp number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;
    const message = buildOrderMessage({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        showPrice: item.showPrice,
      })),
    });

    setSubmitting(true);
    try {
      await api.postOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerLocation: location.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          showPrice: item.showPrice,
        })),
      });
      // Record saved — now open WhatsApp with the pre-filled message.
      void Linking.openURL(waLink(message));
      setSuccessMessage(message);
      clear();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------- Success
  if (successMessage) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.xl,
            padding: 28,
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: colors.ink200,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              backgroundColor: colors.brand100,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 26, color: colors.brand700 }}>✓</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.ink950 }}>
            Order request sent
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.ink500,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Your request has been saved and WhatsApp is opening with your items.
            Bikoom will confirm prices, availability and delivery with you there
            — no payment happens online.
          </Text>
          <View style={{ gap: 10, alignSelf: "stretch", marginTop: 6 }}>
            <Button
              title="Open WhatsApp again"
              variant="whatsapp"
              fullWidth
              onPress={() => void Linking.openURL(waLink(successMessage))}
            />
            <Button
              title="Continue shopping"
              variant="outline"
              fullWidth
              onPress={() => setSuccessMessage(null)}
            />
          </View>
        </View>
      </View>
    );
  }

  // ------------------------------------------------------- Empty
  if (!ready || items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        {!ready ? (
          <View style={{ alignItems: "center" }}>
            <Spinner size="large" />
          </View>
        ) : (
          <EmptyState
            title="Nothing here yet"
            description="Add products from the shop and send them to Bikoom as one order request on WhatsApp."
          />
        )}
      </View>
    );
  }

  // ------------------------------------------------------- Form
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 48, ...top }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: colors.ink950 }}>
            Your order request
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink500, marginTop: 2 }}>
            {count} item{count === 1 ? "" : "s"} · review and continue
          </Text>
        </View>
        <Pressable onPress={() => navigation.navigate("ShopTab" as never)}>
          <Text style={{ color: colors.brand700, fontWeight: "800", fontSize: 13 }}>
            + Add more
          </Text>
        </Pressable>
      </View>

      {/* Items */}
      <View style={{ marginTop: 16, gap: 10 }}>
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.ink200,
              padding: 12,
              flexDirection: "row",
              gap: 12,
            }}
          >
            <View style={{ width: 72, height: 64 }}>
              <ProductImage name={item.name} src={item.imageUrl} />
            </View>
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <View>
                <Text
                  numberOfLines={1}
                  style={{ fontWeight: "800", color: colors.ink950, fontSize: 14 }}
                >
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12.5, color: colors.ink500, marginTop: 2 }}>
                  {item.showPrice && item.price !== null
                    ? `${formatNaira(item.price)} each`
                    : "Contact for price"}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.ink200,
                    borderRadius: radius.sm,
                  }}
                >
                  <Pressable
                    onPress={() => setQuantity(item.id, item.quantity - 1)}
                    style={{ paddingHorizontal: 12, paddingVertical: 5 }}
                  >
                    <Text style={{ fontWeight: "800", color: colors.ink600 }}>−</Text>
                  </Pressable>
                  <Text
                    style={{
                      minWidth: 24,
                      textAlign: "center",
                      fontWeight: "800",
                      fontSize: 13,
                    }}
                  >
                    {item.quantity}
                  </Text>
                  <Pressable
                    onPress={() => setQuantity(item.id, item.quantity + 1)}
                    style={{ paddingHorizontal: 12, paddingVertical: 5 }}
                  >
                    <Text style={{ fontWeight: "800", color: colors.ink600 }}>+</Text>
                  </Pressable>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ fontWeight: "800", fontSize: 13, color: colors.ink700 }}>
                    {item.showPrice && item.price !== null
                      ? formatNaira(item.price * item.quantity)
                      : "—"}
                  </Text>
                  <Pressable onPress={() => remove(item.id)} hitSlop={8}>
                    <Text style={{ color: colors.red, fontWeight: "700", fontSize: 12 }}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Details */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          padding: 16,
          marginTop: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.ink950 }}>
          Your details
        </Text>
        <Text style={{ fontSize: 12.5, color: colors.ink500, marginTop: 2, marginBottom: 12 }}>
          Used by Bikoom to confirm your request on WhatsApp.
        </Text>

        <Field label="Full name" required error={errors.name}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ada Obi"
            autoCapitalize="words"
          />
        </Field>
        <Field label="Phone / WhatsApp number" required error={errors.phone}>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 0803 000 0000"
            keyboardType="phone-pad"
          />
        </Field>
        <Field
          label="Delivery location"
          hint="Leave blank if you're picking up in Ogoja."
        >
          <Input
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Ogoja town, Calabar, Abuja…"
          />
        </Field>
        <Field label="Notes for Bikoom" hint="Colour preferences, questions, timing…">
          <Textarea
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything Bikoom should know about your order…"
            rows={3}
          />
        </Field>
      </View>

      {/* Summary */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          padding: 16,
          marginTop: 16,
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.ink950 }}>
          Summary
        </Text>
        <Row label="Items" value={String(count)} />
        <Row
          label="Displayed total"
          value={pricedTotal > 0 ? formatNaira(pricedTotal) : "—"}
        />

        {hasContactForPrice ? (
          <Callout tone="warning">
            Some items don't show a price — Bikoom will quote those on WhatsApp.
          </Callout>
        ) : null}
        {submitError ? (
          <Callout tone="warning">
            <Text style={{ fontWeight: "700" }}>{submitError}</Text>
          </Callout>
        ) : null}

        <View style={{ marginTop: 4 }}>
          <Button
            title={submitting ? "Sending…" : "Send order via WhatsApp"}
            variant="whatsapp"
            size="lg"
            fullWidth
            loading={submitting}
            onPress={() => void handleSubmit()}
          />
        </View>

        {!profile ? (
          <Text
            style={{
              fontSize: 12,
              color: colors.ink500,
              textAlign: "center",
              lineHeight: 17,
            }}
          >
            No account needed — you can send this as a guest.{" "}
            <Text
              style={{ color: colors.brand700, fontWeight: "800" }}
              onPress={() => navigation.navigate("SignIn" as never)}
            >
              Sign in with Google
            </Text>{" "}
            to save your details for next time.
          </Text>
        ) : null}

        <Text style={{ fontSize: 11.5, color: colors.ink400, textAlign: "center" }}>
          No online payment. Your request is saved and a pre-filled message opens
          in WhatsApp so you and Bikoom can confirm the final price and delivery.
        </Text>
      </View>

      <View style={{ marginTop: 14 }}>
        <Button
          title="Need delivery? Send a waybill request →"
          variant="outline"
          fullWidth
          onPress={() => navigation.navigate("DeliveryTab" as never)}
        />
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ fontSize: 13.5, color: colors.ink500 }}>{label}</Text>
      <Text style={{ fontSize: 13.5, fontWeight: "800", color: colors.ink950 }}>
        {value}
      </Text>
    </View>
  );
}
