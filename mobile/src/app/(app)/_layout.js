import React from "react";
import { Stack } from "expo-router";
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontFamily: "Manrope_600SemiBold" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
      <Stack.Screen
        name="nutrition-result"
        options={{ title: "Nutrition result" }}
      />
    </Stack>
  );
}
