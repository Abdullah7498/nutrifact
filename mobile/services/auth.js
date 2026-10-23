const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, { token, body, method } = {}) {
  if (!API_URL) {
    throw new ApiError("Set EXPO_PUBLIC_API_URL in mobile/.env to your backend URL.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}/${path}`, {
      method: method ?? (body !== undefined || path === "auth/logout" ? "POST" : "GET"),
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const detail = data.message ?? data.detail;
      const message = response.status >= 500
        ? "The server is unavailable. Please try again."
        : typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => typeof item === "string" ? item : item.msg).join(". ")
            : "The request failed. Please try again.";
      throw new ApiError(message, response.status);
    }
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error.name === "AbortError"
        ? "The request timed out. Please try again."
        : "Could not reach the server. Check your connection and API URL.",
    );
  } finally {
    clearTimeout(timer);
  }
}

export function authRequest(path, options) { return apiRequest(`auth/${path}`, options); }

export async function uploadProfilePhoto(token, asset) {
  if (!API_URL) throw new ApiError("Set EXPO_PUBLIC_API_URL in mobile/.env to your backend URL.");
  if (!asset?.base64) throw new ApiError("Could not read the selected photo. Please choose it again.");
  if (asset.base64.length > Math.ceil(5 * 1024 * 1024 / 3) * 4) throw new ApiError("Photo must be under 5 MB.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_URL}/profile/photo`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: asset.base64 }), signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(typeof data.message === "string" ? data.message : response.status === 413 ? "Photo must be under 5 MB." : "Could not upload the photo.", response.status);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.name === "AbortError" ? "Photo upload timed out." : "Could not upload the photo. Check your connection.");
  } finally { clearTimeout(timer); }
}
