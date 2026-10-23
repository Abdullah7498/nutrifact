import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScreenPlaceholder({ title, description }) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center gap-3 p-6">
        <Text variant="headlineMedium" style={{ color: "#166534" }}>
          {title}
        </Text>
        <Text variant="bodyLarge" style={{ color: "#6B7280" }}>
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}
