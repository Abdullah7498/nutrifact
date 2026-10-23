export const SESSION_KEY = "nutrifact.auth-session.v2";

function tokenExpiry(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.exp * 1000;
  } catch {
    return NaN;
  }
}

export function createSession(response, user = response.user) {
  const session = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: tokenExpiry(response.accessToken),
    user,
  };
  if (!isSessionValid(session)) throw new Error("The server returned an invalid session.");
  return session;
}

export function isSessionValid(session, now = Date.now()) {
  return typeof session?.accessToken === "string" &&
    typeof session?.refreshToken === "string" &&
    session.refreshToken.length > 0 &&
    Number.isFinite(session.expiresAt) && session.expiresAt > now &&
    typeof session.user?.id === "string" && session.user.id.length > 0 &&
    typeof session.user?.email === "string" && session.user.email.length > 0;
}

export function hasRefreshToken(session) {
  return typeof session?.refreshToken === "string" && session.refreshToken.length > 0 &&
    typeof session.user?.id === "string" && typeof session.user?.email === "string";
}
