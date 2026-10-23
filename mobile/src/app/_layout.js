import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono/500Medium";
import {
  ActivityIndicator,
  MD3LightTheme,
  PaperProvider,
  Text,
} from "react-native-paper";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import { listenForPushNotifications } from "../../services/pushNotifications";
import "../../global.css";

const theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: "#9A4B27" },
  fonts: Object.fromEntries(
    Object.entries(MD3LightTheme.fonts).map(([variant, style]) => [
      variant,
      {
        ...style,
        fontFamily:
          style.fontWeight === "500"
            ? "Manrope_500Medium"
            : "Manrope_400Regular",
        fontWeight: "normal",
      },
    ]),
  ),
};

function RootNavigator() {
  const { session, isLoading } = useAuth();
  if (isLoading)
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator accessibilityLabel="Restoring session" />
      </View>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !session.user.profileComplete}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !!session.user.profileComplete}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

function PushNotificationObserver() {
  useEffect(() => {
    let stopped = false;
    let unsubscribe;
    listenForPushNotifications().then((stop) => {
      if (stopped) stop();
      else unsubscribe = stop;
    }).catch(() => {});
    return () => {
      stopped = true;
      unsubscribe?.();
    };
  }, []);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        {fontError ? (
          <Text>Unable to load fonts. Please restart the app.</Text>
        ) : (
          <ActivityIndicator accessibilityLabel="Loading fonts" />
        )}
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <PushNotificationObserver />
        <RootNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
