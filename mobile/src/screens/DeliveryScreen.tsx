import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";

import { Button, Callout, Field, Input, Textarea, useTopInset } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { buildDeliveryMessage, waLink } from "../lib/whatsapp";
import { brand } from "../config";
import { colors, radius } from "../theme";

export default function DeliveryScreen() {
  const navigation = useNavigation();
  const { profile } = useAuth();
  const top = useTopInset();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setName((current) => current || profile.full_name || "");
  }, [profile]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (phone.replace(/[^\d+]/g, "").length < 7)
      next.phone = "Enter a valid phone / WhatsApp number.";
    if (location.trim().length < 2)
      next.location = "Where should the item be delivered?";
    if (productInfo.trim().length < 2)
      next.productInfo = "Tell us which product or order this is for.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;
    const message = buildDeliveryMessage({
      name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      productInfo: productInfo.trim(),
      notes: notes.trim() || undefined,
    });
    setSubmitting(true);
    try {
      await api.postDelivery({
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        productInfo: productInfo.trim(),
        notes: notes.trim() || undefined,
      });
      void Linking.openURL(waLink(message));
      setSuccessMessage(message);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            Delivery request received
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.ink500,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Your waybill request is saved. WhatsApp is opening so you can send it
            to {brand.shortName} — delivery cost and timing are agreed directly
            with you.
          </Text>
          <View style={{ gap: 10, alignSelf: "stretch", marginTop: 6 }}>
            <Button
              title="Open WhatsApp again"
              variant="whatsapp"
              fullWidth
              onPress={() => void Linking.openURL(waLink(successMessage))}
            />
            <Button
              title="Back to the shop"
              variant="outline"
              fullWidth
              onPress={() => {
                setSuccessMessage(null);
                navigation.navigate("ShopTab" as never);
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 48, ...top }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          backgroundColor: colors.brand50,
          borderRadius: radius.xl,
          padding: 16,
          gap: 8,
          borderWidth: 1,
          borderColor: colors.brand200,
          marginTop: 4,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "900", color: colors.brand950 }}>
          Delivery / waybill request
        </Text>
        <Text style={{ fontSize: 13.5, color: colors.brand700, lineHeight: 20 }}>
          Ordering from outside Ogoja — or need an item moved? Tell us where it's
          going and we'll arrange delivery with you. Cost and timeline are always
          discussed directly; there are no fixed delivery prices.
        </Text>
      </View>

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
        <Field label="Your name" required error={errors.name}>
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
          required
          error={errors.location}
          hint="Town / state the item should go to."
        >
          <Input
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Calabar, Lagos, Abuja…"
          />
        </Field>
        <Field
          label="Product / order information"
          required
          error={errors.productInfo}
        >
          <Textarea
            value={productInfo}
            onChangeText={setProductInfo}
            placeholder="e.g. 1 × HP EliteBook 840 G8 from my order request…"
            rows={3}
          />
        </Field>
        <Field label="Additional notes" hint="Preferred dates, landmarks, receiver's details…">
          <Textarea
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything else we should know…"
            rows={3}
          />
        </Field>

        {submitError ? (
          <Callout tone="warning">
            <Text style={{ fontWeight: "700" }}>{submitError}</Text>
          </Callout>
        ) : null}

        <View style={{ marginTop: 14, gap: 10 }}>
          <Button
            title={submitting ? "Sending…" : "Send request via WhatsApp"}
            variant="whatsapp"
            size="lg"
            fullWidth
            loading={submitting}
            onPress={() => void handleSubmit()}
          />
          <Button
            title="← Back to my order request"
            variant="ghost"
            onPress={() => navigation.navigate("CartTab" as never)}
          />
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          padding: 16,
          marginTop: 16,
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: "900", color: colors.ink950 }}>How it works</Text>
        <Text style={{ fontSize: 13, color: colors.ink600, lineHeight: 21 }}>
          {"1. Send this request with your details.\n2. Bikoom replies on WhatsApp with cost and timing.\n3. You agree, and your item is dispatched."}
        </Text>
        <Text style={{ fontSize: 12.5, color: colors.ink500, lineHeight: 19 }}>
          {brand.shortName} delivers from Ogoja to other states via trusted
          waybill partners. Photocopying and printing are in-person services
          available in Ogoja only.
        </Text>
      </View>
    </ScrollView>
  );
}
