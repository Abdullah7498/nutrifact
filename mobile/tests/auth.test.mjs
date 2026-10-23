import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

process.env.EXPO_PUBLIC_API_URL = "https://api.example.com/";
async function load(path) {
  return import(`data:text/javascript;base64,${Buffer.from(await readFile(new URL(path, import.meta.url))).toString("base64")}`);
}
const { authRequest, uploadProfilePhoto } = await load("../services/auth.js");
const { createSession, isSessionValid, hasRefreshToken } = await load("../services/session.js");
const token = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.signature`;

test("login and refresh use the Nest auth contract", async () => {
  const original = globalThis.fetch;
  try {
    const calls = [];
    globalThis.fetch = async (...args) => {
      calls.push(args);
      return new Response(JSON.stringify({ accessToken: token, refreshToken: "refresh-token", user: { id: "abc", email: "user@example.com" } }));
    };
    const credentials = { email: "user@example.com", password: "password-123" };
    const session = createSession(await authRequest("login", { body: credentials }));
    assert.equal(calls[0][0], "https://api.example.com/auth/login");
    assert.deepEqual(JSON.parse(calls[0][1].body), credentials);
    assert.equal(isSessionValid(session), true);
    assert.equal(hasRefreshToken(session), true);
    await authRequest("refresh", { body: { refreshToken: session.refreshToken } });
    assert.equal(calls[1][1].method, "POST");
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await authRequest("logout", { token: session.accessToken }), null);
    assert.equal(isSessionValid({ ...session, expiresAt: 0 }), false);
  } finally { globalThis.fetch = original; }
});

test("Nest errors preserve status and network errors are readable", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ message: "Email already exists" }), { status: 409 });
    await assert.rejects(authRequest("register", { body: {} }), (error) => error.status === 409 && error.message === "Email already exists");
    globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
    await assert.rejects(authRequest("refresh"), /Could not reach the server/);
  } finally { globalThis.fetch = original; }
});

test("profile photo selection sends authenticated image data", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let request;
    globalThis.fetch = async (...args) => { request = args; return new Response(JSON.stringify({ photoUrl: "https://signed.example/photo" })); };
    const result = await uploadProfilePhoto("access-token", { base64: "aGVsbG8=" });
    assert.equal(result.photoUrl, "https://signed.example/photo");
    assert.equal(request[0], "https://api.example.com/profile/photo");
    assert.equal(request[1].method, "POST");
    assert.equal(request[1].headers.Authorization, "Bearer access-token");
    assert.equal(request[1].headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(request[1].body), { imageBase64: "aGVsbG8=" });
  } finally { globalThis.fetch = originalFetch; }
});
