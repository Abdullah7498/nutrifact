# Firebase push delivery (backend)

The backend stores FCM registration tokens per signed-in session in MongoDB. It sends notification payloads through the official Firebase Admin SDK. No Firebase service account belongs in the mobile app or Git repository.

## Credentials

Use a Firebase project that matches the Android and Apple config files in `mobile/`. Set `FIREBASE_PROJECT_ID` to the Firebase project ID. On Google Cloud, Application Default Credentials can be provided by the runtime. On another host, create a Firebase service account and set `GOOGLE_APPLICATION_CREDENTIALS` to the absolute path of its JSON file. Keep that file outside the repository. Enable the Firebase Cloud Messaging API (V1) for the project.

For iOS, also upload an APNs authentication key to the Firebase Console under Project settings → Cloud Messaging. The Apple app's bundle ID must match the mobile build.

## Authenticated API

- `POST /notifications/devices` with `{ "token": "<FCM token>", "platform": "android" | "ios" }` registers or refreshes a device. A new sign-in can take ownership of the same token. Registering a rotated token removes the old token for this session.
- `DELETE /notifications/devices` with `{ "token": "<FCM token>" }` removes the device from the current session.
- `POST /notifications/test` sends a fixed test message to the caller's active devices. It is limited to three requests per minute. The response reports `sent` and `failed` counts. Firebase accepting a message does not guarantee the device displayed it.

The reusable `NotificationsService.sendToUser(userId, { title, body })` method can be called by future app events. It sends only to devices attached to active sessions, handles batches of up to 500, and removes tokens that Firebase reports as invalid or unregistered. Device records expire after 90 days without a refresh. Logout revokes the session and removes its device records.

Run `npm test` in `backend/` for the token registration and send filtering tests. A live delivery test requires the Firebase credentials, a MongoDB connection, and a built mobile app.

References: [Firebase Admin setup](https://firebase.google.com/docs/admin/setup), [FCM send API](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk), [token management](https://firebase.google.com/docs/cloud-messaging/manage-tokens).
