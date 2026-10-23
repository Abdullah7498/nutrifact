import React, { useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Button,
  HelperText,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";

const primary = "#9A4B27";
const inputTheme = { roundness: 28 };
const inputStyle = { backgroundColor: "#FFFCFA", height: 48 };
const inputContentStyle = { fontFamily: "Manrope_400Regular", fontSize: 14 };

export default function AuthForm({ register = false }) {
  const { signIn, signUp, storageError } = useAuth();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  async function submit() {
    if (busy) return;
    if (register && name.trim().length < 2) return setError("Please enter your full name.");
    if (register && username.trim().length < 2) return setError("Use a username with at least 2 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Please enter a valid email address.");
    if ((register && password.length < 8) || password.length > 128 || !password.length)
      return setError("Use a password with 8–128 characters.");
    Keyboard.dismiss();
    setError("");
    setBusy(true);
    try {
      await (register ? signUp : signIn)({ email, password, name, username });
      setPassword("");
    } catch (error) {
      setError(error.message || "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const fieldProps = {
    mode: "outlined",
    theme: inputTheme,
    style: inputStyle,
    contentStyle: inputContentStyle,
    outlineColor: "#E1D3CA",
    activeOutlineColor: primary,
    textColor: "#302820",
    disabled: busy,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F3F2]" edges={["bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="position"
        contentContainerStyle={{ flex: 1 }}
      >
        <View className="flex-1">
          <View
            style={{
              flex: 1,
              maxHeight: height * 0.55,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Image
              source={require("../assets/top_down_professional_culinary_food_photography_of_authentic_singapore.png")}
              resizeMode="cover"
              style={{ width: "100%", height: "100%" }}
              accessible={false}
            />
            <IconButton
              icon="arrow-left"
              accessibilityLabel="Back to welcome"
              iconColor="#302820"
              containerColor="#F8F3F2"
              size={22}
              disabled={busy}
              style={{ position: "absolute", top: insets.top + 8, left: 16 }}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/(auth)")
              }
            />
          </View>

          <View
            className="rounded-t-[40px] bg-[#F8F3F2]"
            style={{
              flexShrink: 0,
              marginTop: -36,
              paddingTop: 18,
              paddingBottom: 8,
            }}
          >
            <View className="w-full max-w-lg self-center px-7">
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: "Manrope_700Bold",
                  fontSize: 27,
                  lineHeight: 35,
                  textAlign: "center",
                  color: "#302820",
                }}
              >
                {register ? "Start your " : "Welcome "}
                <Text style={{ fontFamily: "Manrope_700Bold", color: primary }}>
                  {register ? "journey." : "back."}
                </Text>
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 20,
                  textAlign: "center",
                  color: "#71645C",
                  marginTop: 4,
                  marginBottom: 12,
                }}
              >
                {register
                  ? "A little about you. A healthier way forward."
                  : "Your next healthy habit starts here."}
              </Text>

              <View style={{ gap: 10 }}>
                {register && (
                  <TextInput
                    {...fieldProps}
                    label="Full name"
                    value={name}
                    onChangeText={setName}
                    autoComplete="name"
                    textContentType="name"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => usernameRef.current?.focus()}
                    submitBehavior="submit"
                    left={
                      <TextInput.Icon icon="account-outline" color="#A28A7A" />
                    }
                  />
                )}
                {register && (
                  <TextInput
                    {...fieldProps}
                    ref={usernameRef}
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    submitBehavior="submit"
                    left={<TextInput.Icon icon="account-outline" color="#A28A7A" />}
                  />
                )}
                <TextInput
                  {...fieldProps}
                  ref={emailRef}
                  label="Email address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  submitBehavior="submit"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  left={<TextInput.Icon icon="email-outline" color="#A28A7A" />}
                />
                <TextInput
                  {...fieldProps}
                  ref={passwordRef}
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={register ? "new-password" : "current-password"}
                  textContentType={register ? "newPassword" : "password"}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  left={<TextInput.Icon icon="lock-outline" color="#A28A7A" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off-outline" : "eye-outline"}
                      accessibilityLabel={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              </View>
              {!!(error || storageError) && (
                <HelperText type="error" accessibilityLiveRegion="polite">
                  {error || storageError}
                </HelperText>
              )}
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 16,
                  color: "#85736A",
                  textAlign: "center",
                  marginTop: 6,
                  marginBottom: 8,
                }}
              >
                {register ? "Use a password with 8–128 characters." : "Enter your account password."}
              </Text>
              <Button
                mode="contained"
                onPress={submit}
                loading={busy}
                disabled={busy}
                buttonColor={primary}
                textColor="#FFFFFF"
                style={{ borderRadius: 28 }}
                contentStyle={{ minHeight: 48 }}
                labelStyle={{ fontFamily: "Manrope_700Bold", fontSize: 15 }}
              >
                {register ? "Create account" : "Sign in"}
              </Button>

              <Pressable
                disabled={busy}
                onPress={() =>
                  router.replace(
                    register ? "/(auth)/login" : "/(auth)/register",
                  )
                }
                accessibilityRole="link"
                className="items-center justify-center"
                style={{ minHeight: 36 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 20,
                    color: "#71645C",
                    textAlign: "center",
                  }}
                >
                  {register
                    ? "Already have an account? "
                    : "New to Nutrifact? "}
                  <Text
                    style={{
                      fontFamily: "Manrope_600SemiBold",
                      color: primary,
                    }}
                  >
                    {register ? "Sign in" : "Sign up"}
                  </Text>
                </Text>
              </Pressable>

            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
