import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { Category } from "../../../../shared/types";
import { slugify } from "../../../../shared/util";
import { Button, Callout, Field, Input, Spinner, Textarea } from "../../components/ui";
import { api } from "../../lib/api";
import { useRealtimeRefresh } from "../../lib/realtime";
import { colors, radius } from "../../theme";
import type { AdminStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<AdminStackParamList>;

interface FormState {
  name: string;
  description: string;
  sortOrder: string;
}

const EMPTY: FormState = { name: "", description: "", sortOrder: "" };

export default function AdminCategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoadState("loading");
    try {
      setCategories(await api.admin.categories());
      setLoadState("ready");
    } catch (err) {
      console.error("[admin/categories]", err);
      if (!silent) setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh(["categories", "products"], load);

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? "",
      sortOrder: String(category.sort_order),
    });
    setFieldError(null);
    setError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFieldError(null);
    setError(null);
  };

  const handleSave = async () => {
    if (form.name.trim().length < 2) {
      setFieldError("Category name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.name),
      description: form.description.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editingId) {
        const updated = await api.admin.updateCategory(editingId, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)),
        );
      } else {
        const created = await api.admin.createCategory(payload);
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.sort_order - b.sort_order),
        );
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      `Delete "${category.name}"?`,
      "Products in it become uncategorised.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void api.admin
              .deleteCategory(category.id)
              .then(() => {
                setCategories((prev) => prev.filter((c) => c.id !== category.id));
                if (editingId === category.id) resetForm();
              })
              .catch((err: unknown) =>
                Alert.alert(
                  "Could not delete",
                  err instanceof Error ? err.message : String(err),
                ),
              );
          },
        },
      ],
    );
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
        <Callout tone="warning">Could not load categories.</Callout>
        <Button title="Retry" variant="outline" onPress={() => void load()} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}
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
      {/* Form */}
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.ink200,
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.ink950 }}>
          {editingId ? "Edit category" : "Add category"}
        </Text>
        <View style={{ marginTop: 12 }}>
          <Field label="Name" required error={fieldError}>
            <Input
              value={form.name}
              onChangeText={(v) => {
                setForm((f) => ({ ...f, name: v }));
                setFieldError(null);
              }}
              placeholder="e.g. Laptops"
            />
          </Field>
          <Field label="Description" hint="Shown on the category page.">
            <Textarea
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              placeholder="What belongs in this category?"
              rows={2}
            />
          </Field>
          <Field label="Sort order" hint="Lower numbers appear first.">
            <Input
              value={form.sortOrder}
              onChangeText={(v) => setForm((f) => ({ ...f, sortOrder: v }))}
              keyboardType="numeric"
              placeholder="1"
            />
          </Field>
        </View>
        {error ? (
          <Callout tone="warning">
            <Text style={{ fontWeight: "700" }}>{error}</Text>
          </Callout>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Button
              title={saving ? "Saving…" : editingId ? "Save changes" : "Add category"}
              fullWidth
              loading={saving}
              onPress={() => void handleSave()}
            />
          </View>
          {editingId ? (
            <Button title="Cancel" variant="ghost" onPress={resetForm} />
          ) : null}
        </View>
      </View>

      {/* List */}
      <View style={{ gap: 10 }}>
        {categories.map((category) => (
          <View
            key={category.id}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor:
                editingId === category.id ? colors.brand500 : colors.ink200,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontWeight: "800", color: colors.ink950 }}>
                  {category.name}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors.ink400 }}>
                  /{category.slug} · order {category.sort_order}
                </Text>
              </View>
              {category.description ? (
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 12.5, color: colors.ink500, marginTop: 2 }}
                >
                  {category.description}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => startEdit(category)}
              hitSlop={8}
              style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            >
              <Text style={{ color: colors.brand700, fontWeight: "800", fontSize: 13 }}>
                Edit
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(category)}
              hitSlop={8}
              style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            >
              <Text style={{ color: colors.red, fontWeight: "800", fontSize: 13 }}>
                Delete
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 12, color: colors.ink400 }}>
        New categories are linked to products from the product form.
      </Text>
      <View style={{ marginTop: 4 }}>
        <Button
          title="← Back to dashboard"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
      </View>
    </ScrollView>
  );
}
