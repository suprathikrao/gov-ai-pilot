import React, { useState, useRef, useEffect } from "react";
import { Landmark, Send, ArrowRightCircle, Users, Building2, Search as SearchIcon, Paperclip, ScanLine } from "lucide-react";

import { t as theme } from "./data/theme";
import { t as tr } from "./data/translations";
import { LANGUAGES, DEFAULT_LANGUAGE, languageByCode } from "./data/languages";
import { SUGGESTIONS } from "./data/suggestions";
import { INITIAL_DRAFT_REPLIES } from "./data/draftReplies";
import { INITIAL_REQUESTS } from "./data/requests";
import { classifyIntent } from "./utils/classifyIntent";
import { createRequestRecord } from "./utils/tracking";
import { restoreSession, logout as authLogout } from "./utils/auth";
import { checkBackendHealth, listOfficerRequests } from "./utils/api";
import { runLocalOcr } from "./utils/ocr";

import UnderstandingStrip from "./components/UnderstandingStrip";
import DocumentChecklist from "./components/DocumentChecklist";
import StatusTracker from "./components/StatusTracker";
import OfficerView from "./components/OfficerView";
import LoginView from "./components/LoginView";
import DepartmentsPanel from "./components/DepartmentsPanel";
import TrackingSearch from "./components/TrackingSearch";

/* ----------------------------------------------------------------
   MAIN APP
------------------------------------------------------------------ */
export default function GovAICopilot() {
  const [portal, setPortal] = useState("citizen"); // citizen | officer
  const [citizenTab, setCitizenTab] = useState("chat"); // chat | departments | track
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      type: "text",
      content:
        "Namaste! I'm your Government AI Copilot. Ask me about any service — for example, \"I need an income certificate\" — and I'll guide you end to end.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Shared mock "backend" state — in production this lives server-side.
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [draftReplies, setDraftReplies] = useState(INITIAL_DRAFT_REPLIES);
  const [auditLog, setAuditLog] = useState([]);
  const [officer, setOfficer] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    const restored = restoreSession();
    if (restored) setOfficer(restored);

    checkBackendHealth()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    if (!officer) return;

    listOfficerRequests()
      .then((items) => {
        if (Array.isArray(items)) {
          const mapped = items.map((item) => ({
            trackingId: item.request_number,
            citizen: item.citizen_name || "Citizen",
            intentId: item.service_type?.toLowerCase().replace(/\s+/g, "_") || "service",
            intentLabel: item.service_type,
            departmentId: "revenue",
            language: "en",
            status: item.status?.replace(/_/g, " ") || "Submitted",
            confidence: 95,
            submittedDate: item.created_at,
            estCompletion: item.updated_at,
            assignedOfficer: item.assigned_officer_id || null,
            history: [{ status: item.status?.replace(/_/g, " ") || "Submitted", date: item.updated_at, note: item.officer_remarks || "Synced from backend" }],
          }));
          setRequests(mapped);
        }
      })
      .catch(() => {
        setBackendStatus("offline");
      });
  }, [officer]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, portal, citizenTab]);

  function addAuditLog(message) {
    setAuditLog((log) => [...log, { date: new Date().toISOString(), message }]);
  }

  async function handleMediaUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const result = await runLocalOcr(file);
      setMessages((m) => [
        ...m,
        { role: "user", type: "text", content: `Uploaded media: ${file.name}` },
        {
          role: "assistant",
          type: "text",
          content: `OCR result for ${file.name}:\n\n${result.text}${result.confidence != null ? `\n\nConfidence: ${Math.round(result.confidence)}%` : ""}`,
        },
      ]);
    } catch (error) {
      setMessages((m) => [...m, { role: "assistant", type: "text", content: `Media OCR failed: ${error.message}` }]);
    } finally {
      setIsUploadingMedia(false);
    }
  }

  function handleLogout() {
    addAuditLog(`${officer?.name || "Officer"} logged out.`);
    authLogout();
    setOfficer(null);
  }

  function handleLogin(session) {
    setOfficer(session);
    addAuditLog(`${session.name} (${session.role}) logged in.`);
  }

  const langLabel = languageByCode(language).native;

  function handleSend(text) {
    const query = (text ?? input).trim();
    if (!query) return;

    const result = classifyIntent(query);
    setMessages((m) => [...m, { role: "user", type: "text", content: query, understanding: result }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      if (!result.intent) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            type: "text",
            content:
              "I'm not fully confident I understood that. I'm connecting you with a human officer to be safe — meanwhile, try rephrasing, e.g. 'income certificate', 'PAN card', 'driving license', or 'complaint about delay'.",
          },
        ]);
      } else {
        const record = createRequestRecord({ intent: result.intent, language });
        setRequests((rs) => [...rs, record]);
        setMessages((m) => [
          ...m,
          { role: "assistant", type: "checklist", content: result.intent },
          { role: "assistant", type: "tracker", content: record },
        ]);
      }
      setTyping(false);
    }, 900);
  }

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: theme.paperDeep, fontFamily: "'Manrope', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
      `}</style>

      {/* SIDEBAR (desktop) */}
      <aside className="hidden w-64 flex-shrink-0 flex-col md:flex" style={{ background: theme.tealDeep }}>
        <div className="flex items-center gap-2 px-5 py-5" style={{ borderBottom: `1px solid ${theme.teal}` }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: theme.marigold }}>
            <Landmark size={16} color={theme.tealDeep} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: theme.paper, fontFamily: "'Fraunces', serif" }}>
              {tr("appName", language)}
            </div>
            <div className="text-[10px] tracking-widest" style={{ color: theme.marigoldSoft }}>
              {tr("appSubtitle", language)}
            </div>
          </div>
        </div>

        <div className="px-5 pt-5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: theme.slate }}>
          {tr("preferredLanguage", language)}
        </div>
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto px-4 pt-2 pb-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              aria-pressed={language === lang.code}
              className="rounded-full px-2.5 py-1 text-xs transition-colors"
              style={{
                background: language === lang.code ? theme.marigold : "transparent",
                color: language === lang.code ? theme.tealDeep : theme.paper,
                border: `1px solid ${language === lang.code ? theme.marigold : theme.teal}`,
              }}
            >
              {lang.native}
            </button>
          ))}
        </div>

        <div className="px-5 pt-5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: theme.slate }}>
          {tr("tryAsking", language)}
        </div>
        <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-2">
          {SUGGESTIONS.map((group) => (
            <div key={group.category}>
              <p className="px-3 pb-1 text-[10px] font-semibold" style={{ color: theme.marigoldSoft }}>
                {group.category}
              </p>
              <div className="space-y-0.5">
                {group.prompts.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setPortal("citizen"); setCitizenTab("chat"); handleSend(q); }}
                    className="w-full rounded-sm px-3 py-1.5 text-left text-xs transition-colors"
                    style={{ color: theme.paperDeep }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = theme.teal)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mx-4 mb-4 rounded-sm px-3 py-3 text-[11px] leading-relaxed" style={{ background: theme.teal, color: theme.slate }}>
          <span style={{ color: theme.marigoldSoft, fontWeight: 600 }}>Note — </span>
          Prototype. Departments, timelines, officer accounts, and confidence scores are simulated demo data.
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-2 px-6 py-4" style={{ background: theme.teal }}>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: theme.paper, fontFamily: "'Fraunces', serif" }}>
              {tr("headerTitle", language)}
            </h1>
            <p className="text-xs" style={{ color: theme.marigoldSoft }}>
              {tr("headerTagline", language)}
            </p>
            <div className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: backendStatus === "online" ? theme.marigoldSoft : theme.coral }}>
              Backend: {backendStatus}
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full p-1" style={{ background: theme.tealDeep }}>
            {[
              { id: "citizen", label: tr("citizen", language), icon: <Landmark size={13} /> },
              { id: "officer", label: tr("officer", language), icon: <Users size={13} /> },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setPortal(v.id)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: portal === v.id ? theme.marigold : "transparent",
                  color: portal === v.id ? theme.tealDeep : theme.paper,
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </header>

        {portal === "citizen" && (
          <div className="flex items-center gap-1 overflow-x-auto px-6 py-2" style={{ background: theme.paper, borderBottom: `1px solid ${theme.line}` }}>
            {[
              { id: "chat", label: "Chat", icon: <Send size={12} /> },
              { id: "departments", label: tr("departments", language), icon: <Building2 size={12} /> },
              { id: "track", label: tr("trackApplication", language), icon: <SearchIcon size={12} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCitizenTab(tab.id)}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  background: citizenTab === tab.id ? theme.teal : "transparent",
                  color: citizenTab === tab.id ? theme.paper : theme.slate,
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile-only language & suggestion picker (sidebar is desktop-only) */}
        {portal === "citizen" && citizenTab === "chat" && (
          <div className="flex flex-col gap-2 px-6 py-2 md:hidden" style={{ background: theme.paper, borderBottom: `1px solid ${theme.line}` }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label={tr("preferredLanguage", language)}
              className="rounded-sm px-2 py-1.5 text-xs"
              style={{ background: theme.paperDeep, border: `1px solid ${theme.line}`, color: theme.ink }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.native}</option>
              ))}
            </select>
            <select
              onChange={(e) => e.target.value && handleSend(e.target.value)}
              value=""
              aria-label={tr("tryAsking", language)}
              className="rounded-sm px-2 py-1.5 text-xs"
              style={{ background: theme.paperDeep, border: `1px solid ${theme.line}`, color: theme.ink }}
            >
              <option value="">{tr("tryAsking", language)}...</option>
              {SUGGESTIONS.flatMap((g) => g.prompts).map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
        )}

        {portal === "officer" ? (
          officer ? (
            <OfficerView
              officer={officer}
              requests={requests}
              setRequests={setRequests}
              draftReplies={draftReplies}
              setDraftReplies={setDraftReplies}
              auditLog={auditLog}
              addAuditLog={addAuditLog}
              onLogout={handleLogout}
            />
          ) : (
            <LoginView onLogin={handleLogin} />
          )
        ) : citizenTab === "departments" ? (
          <DepartmentsPanel onAskAbout={(label) => { setCitizenTab("chat"); handleSend(label); }} />
        ) : citizenTab === "track" ? (
          <TrackingSearch requests={requests} />
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto px-6 py-6">
              {messages.map((m, i) => (
                <div key={i} className="mb-3">
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.type === "checklist" ? (
                      <DocumentChecklist intent={m.content} />
                    ) : m.type === "tracker" ? (
                      <StatusTracker request={m.content} />
                    ) : (
                      <div
                        className="max-w-md rounded-sm px-4 py-3 text-sm leading-relaxed"
                        style={
                          m.role === "user"
                            ? { background: theme.teal, color: theme.paper }
                            : { background: theme.paper, color: theme.ink, border: `1px solid ${theme.line}` }
                        }
                      >
                        {m.content}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && m.understanding && (
                    <div className="flex justify-end">
                      <UnderstandingStrip result={m.understanding} language={langLabel} />
                    </div>
                  )}
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-sm px-4 py-3" style={{ background: theme.paper, border: `1px solid ${theme.line}` }}>
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full"
                        style={{ background: theme.slate, animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 pt-2">
              <div className="flex items-center gap-2 rounded-sm px-3 py-2" style={{ background: theme.paper, border: `1px solid ${theme.line}` }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={tr("inputPlaceholder", language, { lang: langLabel })}
                  aria-label="Message"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: theme.ink }}
                />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleMediaUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Add media"
                  disabled={isUploadingMedia}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: isUploadingMedia ? theme.slate : theme.teal, opacity: isUploadingMedia ? 0.7 : 1 }}
                >
                  {isUploadingMedia ? <ScanLine size={14} color={theme.paper} className="animate-pulse" /> : <Paperclip size={14} color={theme.marigoldSoft} />}
                </button>
                <button
                  onClick={() => handleSend()}
                  aria-label="Send message"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: theme.teal }}
                >
                  <Send size={14} color={theme.marigoldSoft} />
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[10px]" style={{ color: theme.slate, fontFamily: "'IBM Plex Mono', monospace" }}>
                <ArrowRightCircle size={11} /> {tr("footerNote", language)}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
