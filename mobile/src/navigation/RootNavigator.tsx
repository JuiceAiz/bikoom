import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

import { useCart } from "../context/CartContext";
import { colors } from "../theme";
import AccountScreen from "../screens/AccountScreen";
import AdminBannersScreen from "../screens/admin/AdminBannersScreen";
import AdminCategoriesScreen from "../screens/admin/AdminCategoriesScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminDeliveriesScreen from "../screens/admin/AdminDeliveriesScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminProductFormScreen from "../screens/admin/AdminProductFormScreen";
import AdminProductsScreen from "../screens/admin/AdminProductsScreen";
import CartScreen from "../screens/CartScreen";
import ContactScreen from "../screens/ContactScreen";
import DeliveryScreen from "../screens/DeliveryScreen";
import HomeScreen from "../screens/HomeScreen";
import ProductScreen from "../screens/ProductScreen";
import SignInScreen from "../screens/SignInScreen";
import ShopScreen from "../screens/ShopScreen";

export type RootStackParamList = {
  Tabs: undefined;
  Product: { slug: string };
  Contact: undefined;
  SignIn: { next?: string } | undefined;
  Admin: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminProducts: undefined;
  AdminProductForm: { id?: string } | undefined;
  AdminCategories: undefined;
  AdminBanners: undefined;
  AdminOrders: undefined;
  AdminDeliveries: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();
const Tabs = createBottomTabNavigator();

function CartBadge() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <View
      style={{
        position: "absolute",
        right: -14,
        top: -4,
        backgroundColor: colors.brand600,
        borderRadius: 999,
        minWidth: 18,
        height: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ color: colors.white, fontSize: 10, fontWeight: "800" }}>
        {count}
      </Text>
    </View>
  );
}

function icon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {name === "cart-outline" ? <CartBadge /> : null}
    </View>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand700,
        tabBarInactiveTintColor: colors.ink400,
        tabBarStyle: { borderTopColor: colors.ink200 },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Home", tabBarIcon: icon("home-outline") }}
      />
      <Tabs.Screen
        name="ShopTab"
        component={ShopScreen}
        options={{ title: "Shop", tabBarIcon: icon("storefront-outline") }}
      />
      <Tabs.Screen
        name="CartTab"
        component={CartScreen}
        options={{ title: "Order", tabBarIcon: icon("cart-outline") }}
      />
      <Tabs.Screen
        name="DeliveryTab"
        component={DeliveryScreen}
        options={{ title: "Delivery", tabBarIcon: icon("cube-outline") }}
      />
      <Tabs.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{ title: "Account", tabBarIcon: icon("person-outline") }}
      />
    </Tabs.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { fontWeight: "800", color: colors.ink950 },
        headerTintColor: colors.ink700,
        contentStyle: { backgroundColor: colors.ink50 },
      }}
    >
      <AdminStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: "Dashboard" }}
      />
      <AdminStack.Screen
        name="AdminProducts"
        component={AdminProductsScreen}
        options={{ title: "Products" }}
      />
      <AdminStack.Screen
        name="AdminProductForm"
        component={AdminProductFormScreen}
        options={({ route }) => ({
          title: route.params?.id ? "Edit product" : "Add product",
        })}
      />
      <AdminStack.Screen
        name="AdminCategories"
        component={AdminCategoriesScreen}
        options={{ title: "Categories" }}
      />
      <AdminStack.Screen
        name="AdminBanners"
        component={AdminBannersScreen}
        options={{ title: "Banners" }}
      />
      <AdminStack.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{ title: "Order requests" }}
      />
      <AdminStack.Screen
        name="AdminDeliveries"
        component={AdminDeliveriesScreen}
        options={{ title: "Delivery requests" }}
      />
    </AdminStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTitleStyle: { fontWeight: "800", color: colors.ink950 },
        headerTintColor: colors.ink700,
        contentStyle: { backgroundColor: colors.ink50 },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Product"
        component={ProductScreen}
        options={{ title: "" }}
      />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: "Contact" }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "Sign in" }} />
      <Stack.Screen name="Admin" component={AdminNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
