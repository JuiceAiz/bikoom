import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  const theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: "#efc84a",
      background: "#11110f",
      card: "#1c1b18",
      text: "#f5f2ea",
      border: "#37352f",
      notification: "#c99a13",
    },
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer theme={theme}>
            <RootNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
