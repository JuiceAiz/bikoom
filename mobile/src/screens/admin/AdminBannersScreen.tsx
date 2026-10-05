import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { Banner } from "../../../../shared/types";
import { ProductImage } from "../../components/ProductImage";
import {
  Button,
  Callout,
  Field,
  Input,
  Spinner,
  Toggle,
} from "../../components/ui";
import { api } from "../../lib/api";
import { useRealtimeRefresh } from "../../lib/realtime";
import { colors, radius } from "../../theme";

interface CardState {
  title: string;
  subtitle: string;
  linkUrl: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: string;
}

function toCard(banner: Banner): CardState {
  return {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    linkUrl: banner.link_url ?? "",
    imageUrl: banner.image_url,
    isActive: banner.is_active,
    sortOrder: String(banner.sort_order),
  };
}

export default function AdminBannersScreen() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const applyBanners = useCallback((list: Banner[]) => {
    setBanners(list);
    setCards((prev) => {
      const next: Record<string, CardState> = {};
      for (const banner of list) {
        // Keep unsaved edits; adopt server state for untouched cards.
        next[banner.id] = prev[banner.id] ?? toCard(banner);
      }
      return next;
    });
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoadState("loading");
      try {
        applyBanners(await api.admin.banners());
        setLoadState("ready");
      } catch (err) {
        console.error("[admin/banners]", err);
        if (!silent) setLoadState("error");
      }
    },
    [applyBanners],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(["banners"], load);

  const patchCard = (id: string, patch: Partial<CardState>) => {
    setCards((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const isDirty = (banner: Banner): boolean => {
    const card = cards[banner.id];
    if (!card) return false;
    const baseline = toCard(banner);
    return (Object.keys(baseline) as (keyof CardState)[]).some(
      (key) => card[key] !== baseline[key],
    );
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await api.admin.createBanner({
        title: "New banner",
        subtitle: "Describe what customers should see here",
        linkUrl: "/shop",
        isActive: false,
        sortOrder: banners.length + 1,
      });
      applyBanners([...banners, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the banner.");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (banner: Banner) => {
    const card = cards[banner.id];
    if (!card) return;
    if (card.title.trim().length < 2) {
      setError("Banner title is required.");
      return;
    }
    setSavingId(banner.id);
    setError(null);
    try {
      const updated = await api.admin.updateBanner(banner.id, {
        title: card.title.trim(),
        subtitle: card.subtitle.trim(),
        linkUrl: card.linkUrl.trim(),
        imageUrl: card.imageUrl,
        isActive: card.isActive,
        sortOrder: Number(card.sortOrder) || 0,
      });
      applyBanners(banners.map((b) => (b.id === banner.id ? updated : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the banner.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (banner: Banner) => {
    Alert.alert(`Delete banner "${banner.title}"?`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void api.admin
            .deleteBanner(banner.id)
            .then(() =>
              applyBanners(banners.filter((b) => b.id !== banner.id)),
            )
            .catch((err: unknown) =>
              Alert.alert(
                "Could not delete",
                err instanceof Error ? err.message : String(err),
              ),
            );
        },
      },
    ]);
  };

  const pickImage = async (bannerId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    if (!asset.uri) return;
    setUploadingId(bannerId);
    setError(null);
    try {
      const fileName =
        (asset.fileName ?? `banner-${Date.now()}`).replace(/[^\w.-]/g, "_") ||
        `banner-${Date.now()}`;
      const url = await api.admin.upload(
        asset.uri,
        fileName,
        asset.mimeType ?? "image/jpeg",
        "banners",
      );
      patchCard(bannerId, { imageUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the image.");
    } finally {
      setUploadingId(null);
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
        <Callout tone="warning">Could not load banners.</Callout>
        <Button title="Retry" variant="outline" onPress={() => void load()} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 14, paddingBottom: 48, gap: 14 }}
      keyboardShouldPersistTaps="handled"
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
      <Text style={{ fontSize: 13, color: colors.ink500, lineHeight: 19 }}>
        Banners rotate at the top of the homepage in sort order. Images are
        optional — without one the hero uses the brand gradient.
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            title={creating ? "Creating…" : "＋ New banner"}
            fullWidth
            loading={creating}
            onPress={() => void handleCreate()}
          />
        </View>
      </View>

      {error ? (
        <Callout tone="warning">
          <Text style={{ fontWeight: "700" }}>{error}</Text>
        </Callout>
      ) : null}

      {banners.map((banner) => {
        const card = cards[banner.id];
        if (!card) return null;
        const dirty = isDirty(banner);
        return (
          <View
            key={banner.id}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.ink200,
              padding: 14,
              gap: 4,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 999,
                    backgroundColor: card.isActive
                      ? colors.brand500
                      : colors.ink300,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    color: colors.ink400,
                    letterSpacing: 0.6,
                  }}
                >
                  {card.isActive ? "ACTIVE ON HOMEPAGE" : "HIDDEN"}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(banner)} hitSlop={8}>
                <Text style={{ color: colors.red, fontWeight: "800", fontSize: 12.5 }}>
                  Delete
                </Text>
              </Pressable>
            </View>

            <Field label="Title" required>
              <Input
                value={card.title}
                onChangeText={(v) => patchCard(banner.id, { title: v })}
              />
            </Field>
            <Field label="Subtitle">
              <Input
                value={card.subtitle}
                onChangeText={(v) => patchCard(banner.id, { subtitle: v })}
              />
            </Field>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Field label="Link" hint="e.g. /shop">
                  <Input
                    value={card.linkUrl}
                    onChangeText={(v) => patchCard(banner.id, { linkUrl: v })}
                    autoCapitalize="none"
                    placeholder="/shop"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Sort order">
                  <Input
                    value={card.sortOrder}
                    onChangeText={(v) => patchCard(banner.id, { sortOrder: v })}
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <Toggle
              checked={card.isActive}
              onChange={(v) => patchCard(banner.id, { isActive: v })}
              label="Active"
            />

            <View style={{ height: 120, marginTop: 8 }}>
              <ProductImage
                name={card.title || "Banner"}
                src={card.imageUrl}
                rounded={radius.md}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <Button
                title={
                  uploadingId === banner.id
                    ? "Uploading…"
                    : card.imageUrl
                      ? "Replace image"
                      : "Upload image"
                }
                variant="outline"
                size="sm"
                loading={uploadingId === banner.id}
                onPress={() => void pickImage(banner.id)}
              />
              {card.imageUrl ? (
                <Button
                  title="Remove image"
                  variant="ghost"
                  size="sm"
                  onPress={() => patchCard(banner.id, { imageUrl: null })}
                />
              ) : null}
            </View>

            <View style={{ marginTop: 12 }}>
              <Button
                title={
                  savingId === banner.id ? "Saving…" : dirty ? "Save banner" : "Saved ✓"
                }
                size="sm"
                disabled={!dirty}
                loading={savingId === banner.id}
                onPress={() => void handleSave(banner)}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
