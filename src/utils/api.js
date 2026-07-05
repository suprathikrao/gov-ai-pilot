const DEFAULT_API_BASE_URL = "http://localhost:8000";
const AUTH_STORAGE_KEY = "govai_auth_tokens";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

function getStoredAuthTokens() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return null;
  }
}

function persistAuthTokens(tokens) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // ignore storage issues
  }
}

function clearAuthTokens() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore storage issues
  }
}

function getAuthHeaders(auth = true) {
  const headers = {};
  if (!auth) return headers;
  const tokens = getStoredAuthTokens();
  if (tokens?.access_token) {
    headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  return headers;
}

async function request(path, { method = "GET", body, headers = {}, auth = true, contentType } = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const init = {
    method,
    headers: {
      ...getAuthHeaders(auth),
      ...headers,
    },
  };

  if (contentType) {
    init.headers["Content-Type"] = contentType;
  }

  if (body !== undefined && body !== null) {
    init.body = body;
  }

  const response = await fetch(url, init);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Request failed (${response.status})`);
  }

  return data;
}

export async function checkBackendHealth() {
  return request("/api/health", { auth: false });
}

export async function loginOfficer(username, password) {
  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password,
  });

  const data = await request("/api/auth/login", {
    method: "POST",
    body: body.toString(),
    auth: false,
    contentType: "application/x-www-form-urlencoded",
  });

  persistAuthTokens(data);
  return data;
}

export function logoutAuth() {
  clearAuthTokens();
}

export async function listOfficerRequests() {
  return request("/api/requests");
}

export async function submitCitizenRequest(payload) {
  return request("/api/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
