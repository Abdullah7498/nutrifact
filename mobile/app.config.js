// The base config comes from app.json. These settings are read by Expo builds.
const fs = require("node:fs");
const path = require("node:path");

function firebaseConfigFile(envName, localName) {
  const configured = process.env[envName]?.trim();
  if (configured) {
    if (!fs.existsSync(configured))
      throw new Error(`${envName} points to a missing file`);
    return configured;
  }
  const local = path.join(__dirname, localName);
  return fs.existsSync(local) ? local : undefined;
}

module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const plugins = [...(config.plugins || [])];
  plugins.push("@react-native-firebase/app");
  plugins.push("@react-native-firebase/messaging");
  plugins.push([
    "expo-build-properties",
    { ios: { useFrameworks: "dynamic" } },
  ]);
  if (iosClientId) {
    const suffix = ".apps.googleusercontent.com";
    if (!iosClientId.endsWith(suffix))
      throw new Error("Invalid Google iOS OAuth client ID");
    plugins.push([
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: `com.googleusercontent.apps.${iosClientId.slice(0, -suffix.length)}`,
      },
    ]);
  }
  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      ...(process.env.APP_ANDROID_PACKAGE
        ? { package: process.env.APP_ANDROID_PACKAGE }
        : {}),
      googleServicesFile: firebaseConfigFile(
        "FIREBASE_ANDROID_GOOGLE_SERVICES_FILE",
        "google-services.json",
      ),
      permissions: [
        ...new Set([
          ...(config.android?.permissions || []),
          "android.permission.POST_NOTIFICATIONS",
        ]),
      ],
    },
    ios: {
      ...config.ios,
      ...(process.env.APP_IOS_BUNDLE_IDENTIFIER
        ? { bundleIdentifier: process.env.APP_IOS_BUNDLE_IDENTIFIER }
        : {}),
      googleServicesFile: firebaseConfigFile(
        "FIREBASE_IOS_GOOGLE_SERVICES_FILE",
        "GoogleService-Info.plist",
      ),
      entitlements: {
        ...config.ios?.entitlements,
        "aps-environment":
          process.env.EAS_BUILD_PROFILE === "production"
            ? "production"
            : "development",
      },
    },
  };
};
