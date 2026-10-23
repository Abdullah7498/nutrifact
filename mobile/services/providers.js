import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { authRequest } from "./auth";

export function requireDevelopmentBuild() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new Error("Google and Apple sign-in need the Nutrifact development build. Use email sign-in in Expo Go.");
  }
  if (Platform.OS === "web") {
    throw new Error("Social sign-in is currently available in the Android and iOS apps. Use email sign-in on web.");
  }
}

export async function googleCredentials() {
  requireDevelopmentBuild();
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!webClientId || (Platform.OS === "ios" && !iosClientId)) {
    throw new Error("Google sign-in is not configured for this app yet.");
  }
  const { GoogleSignin, statusCodes } = require("@react-native-google-signin/google-signin");
  GoogleSignin.configure({ webClientId, iosClientId });
  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const result = await GoogleSignin.signIn();
    if (result.type === "cancelled") return null;
    if (!result.data?.idToken) throw new Error("Google did not return a sign-in token. Please try again.");
    return { id_token: result.data.idToken };
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
    if (error.code === statusCodes.IN_PROGRESS) throw new Error("Google sign-in is already in progress.");
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services must be available to sign in with Google.");
    }
    throw error;
  }
}

export async function appleCredentials() {
  requireDevelopmentBuild();
  if (Platform.OS !== "ios") throw new Error("Apple sign-in is available on iOS.");
  const AppleAuthentication = require("expo-apple-authentication");
  if (!(await AppleAuthentication.isAvailableAsync())) {
    throw new Error("Apple sign-in is not available on this device.");
  }
  const { nonce } = await authRequest("apple/challenge", { body: {} });
  try {
    const credential = await AppleAuthentication.signInAsync({
      nonce,
      state: nonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken || credential.state !== nonce) {
      throw new Error("Apple sign-in could not be verified. Please try again.");
    }
    const name = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean).join(" ").slice(0, 100);
    return { id_token: credential.identityToken, nonce, ...(name ? { name } : {}) };
  } catch (error) {
    if (error.code === "ERR_REQUEST_CANCELED") return null;
    throw error;
  }
}
