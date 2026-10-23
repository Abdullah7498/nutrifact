// The base config comes from app.json. These settings are read by Expo builds.
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const plugins = [...(config.plugins || [])];
  if (iosClientId) {
    const suffix = ".apps.googleusercontent.com";
    if (!iosClientId.endsWith(suffix)) throw new Error("Invalid Google iOS OAuth client ID");
    plugins.push(["@react-native-google-signin/google-signin", {
      iosUrlScheme: `com.googleusercontent.apps.${iosClientId.slice(0, -suffix.length)}`,
    }]);
  }
  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      ...(process.env.APP_ANDROID_PACKAGE ? { package: process.env.APP_ANDROID_PACKAGE } : {}),
    },
    ios: {
      ...config.ios,
      ...(process.env.APP_IOS_BUNDLE_IDENTIFIER ? { bundleIdentifier: process.env.APP_IOS_BUNDLE_IDENTIFIER } : {}),
    },
  };
};
