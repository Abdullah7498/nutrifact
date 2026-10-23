import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Button, Text } from "react-native-paper";
import * as AppleAuthentication from "expo-apple-authentication";

export default function SocialSignIn({ busy, onSignIn }) {
  const [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then((available) => { if (active) setAppleAvailable(available); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, []);

  if (Platform.OS === "web") return null;
  return (
    <View className="mt-1">
      <View className="mb-2 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-[#E2D6CD]" />
        <Text style={{ fontSize: 11, color: "#958176" }}>or continue with</Text>
        <View className="h-px flex-1 bg-[#E2D6CD]" />
      </View>
      <View style={{ gap: 8 }}>
        <Button
          mode="outlined"
          icon="google"
          disabled={busy}
          onPress={() => onSignIn("google")}
          textColor="#302820"
          style={{ borderColor: "#DED0C5", borderRadius: 24 }}
          contentStyle={{ minHeight: 44 }}
        >
        </Button>
        {appleAvailable && (
          <View pointerEvents={busy ? "none" : "auto"} style={{ opacity: busy ? 0.5 : 1 }}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={24}
              style={{ width: "100%", height: 44 }}
              onPress={() => onSignIn("apple")}
            />
          </View>
        )}
      </View>
    </View>
  );
}
