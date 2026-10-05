import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Button, Callout } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { colors, radius } from "../theme";

export default function SignInScreen() {
  const navigation = useNavigation();
  const { signInWithGoogle, session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    const message = await signInWithGoogle();
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    navigation.goBack();
  };

  if (session) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 14 }}>
        <Callout tone="success">
          You're signed in as {session.user.email}. You can close this screen.
        </Callout>
        <Button title="Done" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <View style={{ alignItems: "center", gap: 14, marginTop: 24 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: radius.xl,
            backgroundColor: colors.brand600,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.white, fontSize: 30, fontWeight: "900" }}>
            B
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: "900", color: colors.ink950 }}>
          Sign in to Bikoom Stores
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.ink500,
            textAlign: "center",
            lineHeight: 21,
          }}
        >
          Optional for shopping — guests can order too. Signing in saves your
          details for next time and unlocks the admin dashboard for staff
          accounts.
        </Text>

        {error ? (
          <Callout tone="warning">
            <Text style={{ fontWeight: "700" }}>{error}</Text>
          </Callout>
        ) : null}

        <View style={{ alignSelf: "stretch", gap: 10, marginTop: 8 }}>
          <Button
            title="Continue with Google"
            size="lg"
            fullWidth
            loading={busy}
            onPress={() => void handleSignIn()}
          />
          <Button
            title="Keep browsing as guest"
            variant="ghost"
            fullWidth
            onPress={() => navigation.goBack()}
          />
        </View>


      </View>
    </ScrollView>
  );
}
