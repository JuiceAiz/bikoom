import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { Category, Product } from "../../../../shared/types";
import { slugify } from "../../../../shared/util";
import { ProductImage } from "../../components/ProductImage";
import {
  Button,
  Callout,
  Field,
  Input,
  Spinner,
  Textarea,
  Toggle,
} from "../../components/ui";
import { api } from "../../lib/api";
import { colors, radius } from "../../theme";
import type { AdminStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminProductForm">;

interface FormState {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  price: string;
  showPrice: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  imageUrl: string | null;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  price: "",
  showPrice: true,
  isAvailable: true,
  isFeatured: false,
  imageUrl: null,
};

export default function AdminProductFormScreen({ route, navigation }: Props) {
  const id = route.params?.id;
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    isEdit ? "loading" : "ready",
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(false);

  const load = useCallback(async () => {
    setLoadState("loading");
    setError(null);
    try {
      const cats = await api.admin.categories();
      setCategories(cats);
      if (isEdit && id) {
        const products = await api.admin.products();
        const product = products.find((p) => p.id === id);
        if (!product) {
          setError("Product not found.");
          setLoadState("error");
          return;
        }
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.category_id ?? "",
          price: product.price != null ? String(product.price) : "",
          showPrice: product.show_price,
          isAvailable: product.is_available,
          isFeatured: product.is_featured,
          imageUrl: product.image_url,
        });
        setSlugTouched(true);
      }
      setLoadState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the form.");
      setLoadState("error");
    }
  }, [id, isEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    if (!asset.uri) return;
    setUploading(true);
    setError(null);
    try {
      const fileName =
        (asset.fileName ?? `upload-${Date.now()}`).replace(/[^\w.-]/g, "_") ||
        `upload-${Date.now()}`;
      const url = await api.admin.upload(
        asset.uri,
        fileName,
        asset.mimeType ?? "image/jpeg",
        "products",
      );
      update("imageUrl", url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload the image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Product name is required.";
    if (!slugify(form.slug)) next.slug = "A valid slug is required.";
    if (form.showPrice) {
      const price = Number(form.price);
      if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
        next.price = "Enter a price (or turn off Show Price).";
      }
    }
    return next;
  };

  const handleSave = async () => {
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description.trim(),
      categoryId: form.categoryId || null,
      price: form.showPrice ? Number(form.price) : null,
      showPrice: form.showPrice,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      imageUrl: form.imageUrl,
    };
    try {
      if (isEdit && id) {
        await api.admin.updateProduct(id, payload);
      } else {
        await api.admin.createProduct(payload);
      }
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(`Delete "${form.name}"?`, "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setSaving(true);
          void api.admin
            .deleteProduct(id)
            .then(() => navigation.goBack())
            .catch((err: unknown) => {
              setError(
                err instanceof Error ? err.message : "Could not delete the product.",
              );
              setSaving(false);
            });
        },
      },
    ]);
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
        <Callout tone="warning">{error ?? "Could not load the product."}</Callout>
        <Button title="Back to products" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product information */}
        <Section title="Product information">
          <Field label="Name" required error={fieldErrors.name}>
            <Input
              value={form.name}
              onChangeText={(v) => update("name", v)}
              placeholder="e.g. HP EliteBook 840 G8"
            />
          </Field>
          <Field
            label="Slug"
            required
            error={fieldErrors.slug}
            hint="Used in the URL: /product/your-slug"
          >
            <Input
              value={form.slug}
              onChangeText={(v) => {
                setSlugTouched(true);
                update("slug", v);
              }}
              autoCapitalize="none"
              placeholder="hp-elitebook-840-g8"
            />
          </Field>
          <Field
            label="Description"
            hint="Specs, condition, what's included — customers see this on the product page."
          >
            <Textarea
              value={form.description}
              onChangeText={(v) => update("description", v)}
              placeholder="Intel Core i5, 16GB RAM, 512GB SSD…"
              rows={5}
            />
          </Field>
        </Section>

        {/* Image */}
        <Section title="Product image">
          <View style={{ height: 180 }}>
            <ProductImage
              name={form.name || "Product"}
              src={form.imageUrl}
              rounded={radius.lg}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Button
              title={uploading ? "Uploading…" : form.imageUrl ? "Replace image" : "Upload image"}
              variant="outline"
              size="sm"
              loading={uploading}
              onPress={() => void pickImage()}
            />
            {form.imageUrl ? (
              <Button
                title="Remove image"
                variant="ghost"
                size="sm"
                onPress={() => update("imageUrl", null)}
              />
            ) : null}
          </View>
          <Text style={{ fontSize: 12, color: colors.ink400, marginTop: 8 }}>
            PNG, JPG or WEBP up to 5MB. Saved to Supabase Storage.
          </Text>
        </Section>

        {/* Pricing */}
        <Section title="Pricing & visibility">
          <Field label="Category">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Chip
                label="Uncategorised"
                active={form.categoryId === ""}
                onPress={() => update("categoryId", "")}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  active={form.categoryId === category.id}
                  onPress={() => update("categoryId", category.id)}
                />
              ))}
            </View>
          </Field>

          <Field label="Price (₦)" error={fieldErrors.price}>
            <Input
              value={form.price}
              onChangeText={(v) => update("price", v)}
              keyboardType="numeric"
              placeholder="e.g. 785000"
              editable={form.showPrice}
            />
          </Field>

          <Toggle
            checked={form.showPrice}
            onChange={(v) => update("showPrice", v)}
            label="Show price"
            description="Off = customers see “Contact for Price”."
          />
          <Toggle
            checked={form.isAvailable}
            onChange={(v) => update("isAvailable", v)}
            label="In stock"
            description="Out-of-stock products can't be added to carts."
          />
          <Toggle
            checked={form.isFeatured}
            onChange={(v) => update("isFeatured", v)}
            label="Featured"
            description="Show on the homepage featured grid."
          />
        </Section>

        {error ? (
          <Callout tone="warning">
            <Text style={{ fontWeight: "700" }}>{error}</Text>
          </Callout>
        ) : null}

        <View style={{ gap: 10, marginTop: 18 }}>
          <Button
            title={saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            size="lg"
            fullWidth
            loading={saving}
            onPress={() => void handleSave()}
          />
          {isEdit ? (
            <Button
              title="Delete product"
              variant="danger"
              fullWidth
              disabled={saving}
              onPress={handleDelete}
            />
          ) : null}
          <Button
            title="Cancel"
            variant="ghost"
            fullWidth
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.ink200,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "900", color: colors.ink950 }}>
        {title}
      </Text>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? colors.ink950 : colors.white,
        borderColor: active ? colors.ink950 : colors.ink200,
        borderWidth: 1,
        borderRadius: radius.full,
        paddingHorizontal: 13,
        paddingVertical: 7,
      }}
    >
      <Text
        style={{
          fontSize: 12.5,
          fontWeight: "700",
          color: active ? colors.white : colors.ink600,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
