import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { colors, radius } from "../theme";

/**
 * Top padding for header-less tab screens so content clears the status bar.
 */
export function useTopInset(): { paddingTop: number } {
  const insets = useSafeAreaInsets();
  return { paddingTop: insets.top + 14 };
}

/* ------------------------------------------------------------------ Spinner */
export function Spinner({ size = "small" }: { size?: "small" | "large" }) {
  return (
    <ActivityIndicator
      size={size === "large" ? "large" : "small"}
      color={colors.brand600}
    />
  );
}

/* ------------------------------------------------------------------ Button */
type ButtonVariant = "primary" | "outline" | "danger" | "ghost" | "whatsapp";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: "md" | "lg" | "sm";
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  fullWidth,
  size = "md",
}: ButtonProps) {
  const bg = {
    primary: colors.brand600,
    outline: "transparent",
    danger: colors.red,
    ghost: "transparent",
    whatsapp: colors.whatsappDark,
  }[variant];
  const fg = {
    primary: colors.white,
    outline: colors.brand700,
    danger: colors.white,
    ghost: colors.ink600,
    whatsapp: colors.white,
  }[variant];
  const border =
    variant === "outline" ? `1.5px solid ${colors.brand600}` : "transparent";
  const padV = size === "lg" ? 15 : size === "sm" ? 7 : 11;
  const padH = size === "lg" ? 24 : size === "sm" ? 14 : 18;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderColor: colors.brand600,
        borderStyle: "solid",
        borderWidth: variant === "outline" ? 1.5 : 0,
        borderRadius: radius.lg,
        paddingVertical: padV,
        paddingHorizontal: padH,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: fullWidth ? "stretch" : "flex-start",
      })}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : null}
      <Text
        style={{
          color: fg,
          fontWeight: "800",
          fontSize: size === "lg" ? 16 : size === "sm" ? 13 : 14,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------- Field */
export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: colors.ink700,
          marginBottom: 6,
        }}
      >
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : null}
      </Text>
      {children}
      {error ? (
        <Text style={{ color: colors.red, fontSize: 12, marginTop: 4 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={{ color: colors.ink500, fontSize: 12, marginTop: 4 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------- Input */
export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.ink400}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.ink200,
          backgroundColor: colors.white,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.ink950,
        },
        props.editable === false && { backgroundColor: colors.ink100 },
        props.style as object,
      ]}
    />
  );
}

export function Textarea({
  rows = 4,
  ...props
}: TextInputProps & { rows?: number }) {
  return (
    <Input
      {...props}
      multiline
      textAlignVertical="top"
      style={[{ minHeight: rows * 22 }, props.style as object]}
    />
  );
}

/* ------------------------------------------------------------------ Toggle */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 6,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink700 }}>
          {label}
        </Text>
        {description ? (
          <Text style={{ fontSize: 12, color: colors.ink500, marginTop: 2 }}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={checked}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.ink300, true: colors.brand500 }}
        thumbColor={colors.white}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ Callout */
export function Callout({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning" | "success";
  children: ReactNode;
}) {
  const palette = {
    info: { bg: colors.brand50, fg: colors.brand700 },
    warning: { bg: colors.amberBg, fg: colors.amber },
    success: { bg: colors.greenBg, fg: colors.green },
  }[tone];
  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderRadius: radius.md,
        padding: 14,
        borderWidth: 1,
        borderColor: palette.fg + "33",
      }}
    >
      <Text style={{ color: palette.fg, fontSize: 13, lineHeight: 19 }}>
        {children}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------- Badge */
export function Badge({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "amber" | "green" | "red" | "gray";
  children: ReactNode;
}) {
  const palette = {
    blue: { bg: colors.blueBg, fg: colors.blue },
    amber: { bg: colors.amberBg, fg: colors.amber },
    green: { bg: colors.greenBg, fg: colors.green },
    red: { bg: colors.redBg, fg: colors.red },
    gray: { bg: colors.ink100, fg: colors.ink600 },
  }[tone];
  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderRadius: radius.full,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: palette.fg,
          fontSize: 11,
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------- EmptyState */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, gap: 8 }}>
      <Text style={{ fontSize: 17, fontWeight: "800", color: colors.ink700 }}>
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            fontSize: 14,
            color: colors.ink500,
            textAlign: "center",
            maxWidth: 300,
            lineHeight: 20,
          }}
        >
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Chips */
export interface ChipOption {
  value: string;
  label: string;
}

export function Chips({
  options,
  value,
  onChange,
}: {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              backgroundColor: active ? colors.ink950 : colors.white,
              borderColor: active ? colors.ink950 : colors.ink200,
              borderWidth: 1,
              borderRadius: radius.full,
              paddingHorizontal: 14,
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
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
