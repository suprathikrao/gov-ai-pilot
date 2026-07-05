import React, { useState } from "react";
import { Landmark, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";
import { t } from "../data/theme";
import { login, requestPasswordReset } from "../utils/auth";

/* ----------------------------------------------------------------
   OFFICER LOGIN — credential auth gate for the Officer portal.
   Demo credentials shown on-screen since there is no real backend;
   remove that hint block in a production deployment.
------------------------------------------------------------------ */
export default function LoginView({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // login | reset
  const [resetMessage, setResetMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }
    const result = await login(username, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onLogin(result.session);
  }

  function handleReset(e) {
    e.preventDefault();
    const result = requestPasswordReset(username);
    setResetMessage(result.ok ? result.message : result.error);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10" style={{ background: t.paperDeep }}>
      <div className="w-full max-w-sm rounded-sm px-6 py-7" style={{ background: t.paper, border: `1px solid ${t.line}` }}>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: t.marigold }}>
            <Landmark size={17} color={t.tealDeep} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: t.ink, fontFamily: "'Fraunces', serif" }}>
              Officer Portal
            </div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: t.slate }}>
              Secure access
            </div>
          </div>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label htmlFor="officer-username" className="mb-1 block text-[11px] font-semibold" style={{ color: t.slate }}>
                Username or Email
              </label>
              <input
                id="officer-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-sm px-3 py-2 text-sm outline-none"
                style={{ background: t.paperDeep, border: `1px solid ${t.line}`, color: t.ink }}
              />
            </div>
            <div>
              <label htmlFor="officer-password" className="mb-1 block text-[11px] font-semibold" style={{ color: t.slate }}>
                Password
              </label>
              <input
                id="officer-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-sm px-3 py-2 text-sm outline-none"
                style={{ background: t.paperDeep, border: `1px solid ${t.line}`, color: t.ink }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: t.coral }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-sm py-2 text-sm font-medium"
              style={{ background: t.teal, color: t.paper }}
            >
              <LogIn size={14} /> Sign in
            </button>

            <button
              type="button"
              onClick={() => { setMode("reset"); setError(""); setResetMessage(""); }}
              className="w-full text-center text-[11px]"
              style={{ color: t.teal }}
            >
              Forgot password?
            </button>

            <div className="mt-3 rounded-sm px-3 py-2 text-[10px] leading-relaxed" style={{ background: t.paperDeep, color: t.slate }}>
              <span style={{ fontWeight: 600, color: t.ink }}>Demo credentials — </span>
              admin / Admin@123 (Admin), officer.revenue / Officer@123 (Department Officer, Revenue).
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-3" noValidate>
            <p className="text-xs" style={{ color: t.slate }}>
              Enter your username or email and we'll send password reset instructions.
            </p>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or email"
              className="w-full rounded-sm px-3 py-2 text-sm outline-none"
              style={{ background: t.paperDeep, border: `1px solid ${t.line}`, color: t.ink }}
            />
            {resetMessage && (
              <div className="flex items-start gap-1.5 text-xs" style={{ color: t.sage }}>
                <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" /> {resetMessage}
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded-sm py-2 text-sm font-medium"
              style={{ background: t.teal, color: t.paper }}
            >
              Send reset instructions
            </button>
            <button
              type="button"
              onClick={() => { setMode("login"); setResetMessage(""); }}
              className="w-full text-center text-[11px]"
              style={{ color: t.teal }}
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
