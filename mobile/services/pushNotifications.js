import { Alert, PermissionsAndroid, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiRequest } from "./auth";

const PUSH_TOKEN_KEY = "nutrifact.push-token.v1";
let preferenceVersion = 0;

async function messagingModule() {
  if (Platform.OS === "web") throw new Error("Push notifications are available in the mobile app only.");
  try {
    return await import("@react-native-firebase/messaging");
  } catch {
    throw new Error("Firebase messaging needs a new development or production build.");
  }
}

export async function getSavedPushToken() {
  if (Platform.OS === "web") return null;
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

async function savePushToken(token) {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearPushPreference() {
  preferenceVersion += 1;
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

async function registerToken(accessToken, token) {
  const version = preferenceVersion;
  await apiRequest("notifications/devices", {
    token: accessToken,
    body: {
      token,
      platform: Platform.OS,
    },
  });
  if (version !== preferenceVersion) {
    await apiRequest("notifications/devices", {
      token: accessToken,
      method: "DELETE",
      body: { token },
    }).catch(() => {});
    return null;
  }
  await savePushToken(token);
  return token;
}

async function permissionGranted(messaging, instance, request) {
  if (Platform.OS === "android") {
    if (Number(Platform.Version) < 33) return true;
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    const result = request
      ? await PermissionsAndroid.request(permission)
      : await PermissionsAndroid.check(permission);
    return request ? result === PermissionsAndroid.RESULTS.GRANTED : result;
  }
  const status = request
    ? await messaging.requestPermission(instance)
    : await messaging.hasPermission(instance);
  return status === messaging.AuthorizationStatus.AUTHORIZED || status === messaging.AuthorizationStatus.PROVISIONAL;
}

async function nativeToken(messaging, instance) {
  if (Platform.OS === "ios" && !messaging.isDeviceRegisteredForRemoteMessages(instance)) {
    await messaging.registerDeviceForRemoteMessages(instance);
  }
  return messaging.getToken(instance);
}

export async function enablePushNotifications(accessToken) {
  const messaging = await messagingModule();
  const instance = messaging.getMessaging();
  if (!(await permissionGranted(messaging, instance, true))) {
    if (await getSavedPushToken()) await disablePushNotifications(accessToken);
    return null;
  }
  const token = await nativeToken(messaging, instance);
  return registerToken(accessToken, token);
}

export async function syncPushNotifications(accessToken) {
  const previousToken = await getSavedPushToken();
  if (!previousToken) return null;
  const messaging = await messagingModule();
  const instance = messaging.getMessaging();
  if (!(await permissionGranted(messaging, instance, false))) {
    await disablePushNotifications(accessToken);
    return null;
  }
  const token = await nativeToken(messaging, instance);
  return registerToken(accessToken, token);
}

export async function disablePushNotifications(accessToken) {
  const token = await getSavedPushToken();
  if (token) {
    await apiRequest("notifications/devices", {
      token: accessToken,
      method: "DELETE",
      body: { token },
    });
  }
  await clearPushPreference();
}

export async function sendTestPushNotification(accessToken) {
  return apiRequest("notifications/test", { token: accessToken, method: "POST" });
}

export async function listenForPushNotifications(accessToken) {
  if (Platform.OS === "web") return () => {};
  const messaging = await messagingModule();
  const instance = messaging.getMessaging();
  const stopMessage = messaging.onMessage(instance, (message) => {
    const title = message.notification?.title;
    const body = message.notification?.body;
    if (title || body) Alert.alert(title || "Nutrifact", body || "");
  });
  const stopToken = messaging.onTokenRefresh(instance, async (token) => {
    try {
      const previousToken = await getSavedPushToken();
      if (previousToken) await registerToken(accessToken, token);
    } catch {}
  });
  return () => {
    stopMessage();
    stopToken();
  };
}
