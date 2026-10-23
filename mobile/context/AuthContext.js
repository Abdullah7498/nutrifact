import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createSession, hasRefreshToken, isSessionValid, SESSION_KEY } from "../services/session";
import { apiRequest, authRequest } from "../services/auth";
import { clearPushPreference } from "../services/pushNotifications";

const AuthContext = createContext(null);
const storage = {
  get: () => Platform.OS === "web" ? Promise.resolve(null) : SecureStore.getItemAsync(SESSION_KEY),
  set: (value) => Platform.OS === "web" ? Promise.resolve() : SecureStore.setItemAsync(SESSION_KEY, value),
  clear: () => Platform.OS === "web" ? Promise.resolve() : SecureStore.deleteItemAsync(SESSION_KEY),
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  const refreshPromise = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState("");

  async function refresh(current) {
    if (refreshPromise.current) return refreshPromise.current;
    const pending = (async () => {
      const response = await authRequest("refresh", { body: { refreshToken: current.refreshToken } });
      const next = createSession(response, response.user ?? current.user);
      await storage.set(JSON.stringify(next));
      sessionRef.current = next;
      setSession(next);
      setStorageError("");
      return next;
    })();
    refreshPromise.current = pending;
    try { return await pending; } finally { refreshPromise.current = null; }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await storage.get();
        const parsed = saved ? JSON.parse(saved) : null;
        if (hasRefreshToken(parsed)) {
          try {
            const next = await refresh(parsed);
            if (!active) { sessionRef.current = null; setSession(null); }
          } catch (error) {
            if (error.status === 401) await storage.clear();
            else throw error;
          }
        } else if (saved) await storage.clear();
      } catch {
        if (active) setStorageError("Could not restore your saved session. Please sign in again.");
      } finally { if (active) setIsLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session) return;
    const delay = Math.max(0, session.expiresAt - Date.now() - 60000);
    const renew = () => refresh(sessionRef.current).catch(async (error) => {
      if (error.status === 401) {
        await storage.clear().catch(() => {});
        sessionRef.current = null;
        setSession(null);
      } else {
        sessionRef.current = null;
        setSession(null);
        setStorageError("Could not renew your session. Check your connection.");
      }
    });
    const timer = setTimeout(renew, delay);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !isSessionValid(sessionRef.current)) renew();
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [session]);

  async function authenticate(credentials) {
    const response = await authRequest("login", { body: credentials });
    const next = createSession(response);
    try { await storage.set(JSON.stringify(next)); }
    catch {
      await authRequest("logout", { token: next.accessToken }).catch(() => {});
      throw new Error("Could not save your session securely. Please try signing in again.");
    }
    sessionRef.current = next;
    setStorageError("");
    setSession(next);
  }

  const signIn = ({ email, password }) => authenticate({ email: email.trim().toLowerCase(), password });
  async function signUp({ email, password, name, username }) {
    const credentials = { email: email.trim().toLowerCase(), password };
    await authRequest("register", { body: { ...credentials, name: name.trim(), username: username.trim().toLowerCase() } });
    await authenticate(credentials);
  }

  async function completeProfile() {
    const current = sessionRef.current;
    if (!current) return;
    const next = { ...current, user: { ...current.user, profileComplete: true } };
    await storage.set(JSON.stringify(next));
    sessionRef.current = next;
    setSession(next);
  }

  async function signOut() {
    const current = sessionRef.current;
    if (current) {
      try {
        const valid = isSessionValid(current) ? current : await refresh(current);
        await authRequest("logout", { token: valid.accessToken });
      } catch (error) { if (error.status !== 401) throw error; }
    }
    await storage.clear();
    await clearPushPreference().catch(() => {});
    sessionRef.current = null;
    setStorageError("");
    setSession(null);
  }

  return <AuthContext.Provider value={{ session, isLoading, storageError, signIn, signUp, signOut, completeProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
