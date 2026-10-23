import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
const icons = {
  index: "home-outline",
  diary: "book-outline",
  scan: "camera-outline",
  insights: "stats-chart-outline",
  profile: "person-outline",
};
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabelStyle: { fontFamily: "Manrope_700Bold", fontSize: 10, marginTop: 2 },
        tabBarStyle: { backgroundColor: "#FFFCFA", borderTopColor: "#E9DDD5", height: 64, paddingTop: 8, paddingBottom: 7 },
        tabBarActiveTintColor: "#9A4B27",
        tabBarInactiveTintColor: "#8B7B71",
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="diary" options={{ title: "Diary" }} />
      <Tabs.Screen name="scan" options={{ title: "Scan" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
