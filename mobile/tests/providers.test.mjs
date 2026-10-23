import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const original = await readFile(new URL("../services/providers.js", import.meta.url), "utf8");
let instance = 0;
async function providers({ expoGo = false, os = "android", module, request } = {}) {
  const key = `provider-test-${instance++}`;
  globalThis[key] = { module, request };
  const source = original
    .replace('import Constants, { ExecutionEnvironment } from "expo-constants";', `const Constants = { executionEnvironment: ${JSON.stringify(expoGo ? "storeClient" : "standalone")} }; const ExecutionEnvironment = { StoreClient: "storeClient" };`)
    .replace('import { Platform } from "react-native";', `const Platform = { OS: ${JSON.stringify(os)} };`)
    .replace('import { authRequest } from "./auth";', `const authRequest = globalThis[${JSON.stringify(key)}].request; const require = () => globalThis[${JSON.stringify(key)}].module;`);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

test("Expo Go never loads native Google or Apple sign-in modules", async () => {
  const api = await providers({ expoGo: true });
  await assert.rejects(api.googleCredentials(), /development build/);
  await assert.rejects(api.appleCredentials(), /development build/);
});

test("Google cancellation does not create an API session", async () => {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "web-client";
  const api = await providers({ module: {
    statusCodes: {},
    GoogleSignin: { configure() {}, async hasPlayServices() {}, async signIn() { return { type: "cancelled" }; } },
  } });
  assert.equal(await api.googleCredentials(), null);
});

test("Google passes only its ID token to the backend", async () => {
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "web-client";
  const api = await providers({ module: {
    statusCodes: {},
    GoogleSignin: { configure() {}, async hasPlayServices() {}, async signIn() { return { type: "success", data: { idToken: "signed-token", user: { email: "untrusted@example.com" } } }; } },
  } });
  assert.deepEqual(await api.googleCredentials(), { id_token: "signed-token" });
});

test("Apple obtains and returns the server challenge with its ID token", async () => {
  const api = await providers({ os: "ios", request: async (path, options) => {
    assert.equal(path, "apple/challenge");
    assert.deepEqual(options.body, {});
    return { nonce: "server-nonce" };
  }, module: {
    async isAvailableAsync() { return true; },
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
    async signInAsync(options) {
      assert.equal(options.nonce, "server-nonce");
      return { state: options.state, identityToken: "signed-apple-token", fullName: { givenName: "Test", familyName: "User" } };
    },
  } });
  assert.deepEqual(await api.appleCredentials(), { id_token: "signed-apple-token", nonce: "server-nonce", name: "Test User" });
});
