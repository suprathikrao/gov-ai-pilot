import { findOfficer } from "../data/officers";
import { loginOfficer, logoutAuth } from "./api";

/* ----------------------------------------------------------------
   AUTH — demo-only client-side session handling.
   In production: replace with real backend session/JWT issuance,
   HTTPS-only cookies, password hashing, MFA, and rate limiting on
   login attempts.
------------------------------------------------------------------ */
const SESSION_KEY = "govai_officer_session";

export async function login(username, password) {
  try {
    const tokens = await loginOfficer(username, password);
    const roleMap = {
      admin: "Admin",
      supervisor: "Supervisor",
      officer: "Department Officer",
      citizen: "Citizen",
    };
    const normalizedRole = roleMap[(tokens.role?.value || tokens.role || "officer").toLowerCase()] || "Department Officer";
    const departmentId = username.includes("revenue") ? "revenue" : username.includes("municipal") ? "municipal" : username.includes("grievance") ? "grievance_cell" : null;
    const session = {
      id: tokens.user_id || username,
      username,
      name: username,
      role: normalizedRole,
      departmentId,
      accessToken: tokens.access_token,
    };
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // localStorage may be unavailable (e.g. private browsing) — session still works in-memory.
    }
    return { ok: true, session };
  } catch (error) {
    return { ok: false, error: error.message || "Invalid username or password." };
  }
}

export function logout() {
  logoutAuth();
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* no-op */
  }
}

export function restoreSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function requestPasswordReset(usernameOrEmail) {
  // Simulated — no backend/email service wired up in this prototype.
  if (!usernameOrEmail || !usernameOrEmail.trim()) {
    return { ok: false, error: "Enter your username or email first." };
  }
  return { ok: true, message: `If an account matches "${usernameOrEmail.trim()}", a reset link has been sent.` };
}
