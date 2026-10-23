import { Alert, PermissionsAndroid, Platform } from "react-native";

let currentToken = null;

async function messagingModule() {
  if (Platform.OS === "web") throw new Error("Push notifications are available in the mobile app only.");
  try {
    return await import("@react-native-firebase/messaging");
  } catch {
    throw new Error("Firebase messaging needs a new development or production build.");
  }
}

export async function enablePushNotifications() {
  const messaging = await messagingModule();
  const instance = messaging.getMessaging();

  if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return null;
  }

  if (Platform.OS === "ios") {
    const status = await messaging.requestPermission(instance);
    if (status !== messaging.AuthorizationStatus.AUTHORIZED && status !== messaging.AuthorizationStatus.PROVISIONAL) return null;
    if (!messaging.isDeviceRegisteredForRemoteMessages(instance)) {
      await messaging.registerDeviceForRemoteMessages(instance);
    }
  }

  currentToken = await messaging.getToken(instance);
  return currentToken;
}

export function getCurrentPushToken() {
  return currentToken;
}

export async function listenForPushNotifications() {
  if (Platform.OS === "web") return () => {};
  const messaging = await messagingModule();
  const instance = messaging.getMessaging();
  const stopMessage = messaging.onMessage(instance, (message) => {
    const title = message.notification?.title;
    const body = message.notification?.body;
    if (title || body) Alert.alert(title || "Nutrifact", body || "");
  });
  const stopToken = messaging.onTokenRefresh(instance, (token) => {
    currentToken = token;
  });
  return () => {
    stopMessage();
    stopToken();
  };
}
