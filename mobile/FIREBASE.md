# Firebase push notifications (mobile)

This app uses React Native Firebase Messaging for Android and iOS. It needs a **development or production build**; Expo Go cannot load the native Firebase modules. The app registers an FCM token with the authenticated Nest backend after the user enables notifications. The backend sends through Firebase Admin.

## Firebase Console setup

1. Create a Firebase project and add an Android app whose package name matches `APP_ANDROID_PACKAGE` (or `android.package` in `app.json`). Download `google-services.json` to `mobile/google-services.json`.
2. Add an Apple app whose bundle ID matches `APP_IOS_BUNDLE_IDENTIFIER` (or `ios.bundleIdentifier` in `app.json`). Download `GoogleService-Info.plist` to `mobile/GoogleService-Info.plist`.
3. For iOS, enable Push Notifications for the Apple App ID and upload an APNs authentication key under Firebase Console → Project settings → Cloud Messaging → Apple app configuration.
4. Replace the placeholder `com.yourname.nutrifact` identifiers before registering Firebase apps. The config files must come from the same Firebase project as your FCM sender.

The downloaded files are ignored by Git. For EAS cloud builds, create **file** environment variables named `FIREBASE_ANDROID_GOOGLE_SERVICES_FILE` and `FIREBASE_IOS_GOOGLE_SERVICES_FILE` in each EAS environment you build. `app.config.js` reads those paths, falling back to the local files. Build with `npx eas-cli@latest build --profile development --platform android` (or `ios`). Native configuration changes require a new build.

## Test receiving a notification

Configure the backend Firebase credentials as described in [`../backend/NOTIFICATIONS.md`](../backend/NOTIFICATIONS.md). Open the Profile screen in a development build and tap **Enable notifications**. Grant the OS permission, then tap **Send test notification**. In development builds, **Share test FCM token** also lets you copy the device token for a Firebase Console test. A notification sent with a `notification` title and body is displayed by the operating system when the app is in the background; while the app is open, the app shows an alert.

The app stores the token in SecureStore after the backend accepts it, syncs it again after sign-in or session refresh, and updates the backend when FCM rotates the token. **Disable notifications** unregisters the token. Signing out revokes the session and removes its registered devices on the backend. Keep Firebase Admin credentials only on the backend.

References: [React Native Firebase Expo setup](https://rnfirebase.io/), [Messaging setup](https://rnfirebase.io/messaging/usage), [iOS APNs setup](https://rnfirebase.io/messaging/usage/ios-setup), [EAS file environment variables](https://docs.expo.dev/eas/environment-variables/).
