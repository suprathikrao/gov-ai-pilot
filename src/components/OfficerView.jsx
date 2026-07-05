import React, { useMemo, useState } from "react";
import {
  ShieldAlert, ChevronRight, LogOut, Search, Send, ClipboardList,
  UserCog, Building2, ListChecks,
} from "lucide-react";
import { t, statusColor } from "../data/theme";
import { DEPARTMENTS, departmentName } from "../data/departments";
import { STATUS_FLOW, REJECTED } from "../data/intents";
import { advanceStatus, formatDate } from "../utils/tracking";
import { officerCanSeeDepartment } from "../data/officers";
import DraftReplies from "./DraftReplies";
import StatusTracker from "./StatusTracker";

const ALL_STATUSES = [...STATUS_FLOW, REJECTED];

/* ----------------------------------------------------------------
   OFFICER DASHBOARD
   RBAC: Admins see every department; Supervisors/Department
   Officers are scoped to their own departmentId.
------------------------------------------------------------------ */
export default function OfficerView({ officer, requests, setRequests, draftReplies, setDraftReplies, auditLog, addAuditLog, onLogout }) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(officer.role === "Admin" ? "all" : officer.departmentId);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState("");

  const scoped = useMemo(
    () => requests.filter((r) => officerCanSeeDepartment(officer, r.departmentId)),
    [requests, officer]
  );

  const filtered = scoped.filter((r) => {
    const matchesSearch =
      !search ||
      r.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      r.citizen.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || r.departmentId === deptFilter;
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const stats = {
    total: scoped.length,
    pending: scoped.filter((r) => !["Completed", "Approved", "Rejected"].includes(r.status)).length,
    approved: scoped.filter((r) => r.status === "Approved" || r.status === "Completed").length,
    rejected: scoped.filter((r) => r.status === "Rejected").length,
  };

  const selected = requests.find((r) => r.trackingId === selectedId) || null;

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function updateStatus(newStatus) {
    if (!selected) return;
    setRequests((rs) =>
      rs.map((r) => (r.trackingId === selected.trackingId ? advanceStatus(r, newStatus, noteText || undefined, officer.name) : r))
    );
    addAuditLog(`${officer.name} set ${selected.trackingId} to "${newStatus}"${noteText ? ` — ${noteText}` : ""}`);
    setNoteText("");
    showToast(`Citizen notified: status changed to "${newStatus}".`);
  }

  function sendReply() {
    if (!selected || !replyText.trim()) return;
    addAuditLog(`${officer.name} sent a reply on ${selected.trackingId}: "${replyText.slice(0, 60)}${replyText.length > 60 ? "…" : ""}"`);
    showToast("Reply sent to citizen (simulated).");
    setReplyText("");
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: t.ink, fontFamily: "'Fraunces', serif" }}>
            Welcome, {officer.name}
          </h2>
          <p className="text-xs" style={{ color: t.slate }}>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: t.paperDeep, color: t.teal }}>
              {officer.role}
            </span>{" "}
            {officer.departmentId ? `· ${departmentName(officer.departmentId)}` : "· All departments"}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{ background: t.teal, color: t.paper }}
        >
          <LogOut size={13} /> Log out
        </button>
      </div>

      {toast && (
        <div className="mb-3 rounded-sm px-3 py-2 text-xs" style={{ background: "rgba(107,143,113,0.15)", color: t.sage }}>
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total requests", value: stats.total },
          { label: "Pending / in progress", value: stats.pending },
          { label: "Approved / completed", value: stats.approved },
          { label: "Rejected", value: stats.rejected },
        ].map((s) => (
          <div key={s.label} className="rounded-sm px-3 py-2" style={{ background: t.paper, border: `1px solid ${t.line}` }}>
            <div className="text-lg font-semibold" style={{ color: t.ink }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: t.slate }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-sm px-3 py-1.5" style={{ background: t.paper, border: `1px solid ${t.line}` }}>
          <Search size={13} style={{ color: t.slate }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking ID or applicant..."
            aria-label="Search requests"
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: t.ink }}
          />
        </div>
        {officer.role === "Admin" && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-sm px-2 py-1.5 text-xs"
            style={{ background: t.paper, border: `1px solid ${t.line}`, color: t.ink }}
          >
            <option value="all">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-sm px-2 py-1.5 text-xs"
          style={{ background: t.paper, border: `1px solid ${t.line}`, color: t.ink }}
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="mb-5 overflow-hidden rounded-sm" style={{ border: `1px solid ${t.line}` }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ background: t.teal }}>
              {["Tracking ID", "Citizen", "Service", "Department", "Status", "Officer", ""].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: t.paper }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-4 text-center text-xs" style={{ color: t.slate }}>No requests match these filters.</td></tr>
            )}
            {filtered.map((row, i) => (
              <tr key={row.trackingId} style={{ background: i % 2 ? t.paperDeep : t.paper }}>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs" style={{ color: t.slate }}>{row.trackingId}</td>
                <td className="px-4 py-2.5" style={{ color: t.ink }}>{row.citizen}</td>
                <td className="px-4 py-2.5" style={{ color: t.ink }}>{row.intentLabel}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: t.slate }}>{departmentName(row.departmentId)}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "rgba(0,0,0,0.05)", color: statusColor(row.status) }}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: t.slate }}>{row.assignedOfficer || "—"}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => { setSelectedId(row.trackingId); setNoteText(""); }}
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: t.teal }}
                  >
                    Manage <ChevronRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.slate }}>
              <ClipboardList size={12} /> Request detail
            </p>
            <StatusTracker request={selected} />

            <div className="mt-3 rounded-sm px-4 py-3" style={{ background: t.paper, border: `1px solid ${t.line}` }}>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: t.ink }}>
                <UserCog size={13} /> Update status
              </p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={s === selected.status}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium disabled:opacity-40"
                    style={{ background: s === selected.status ? t.paperDeep : t.teal, color: s === selected.status ? t.slate : t.paper }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Optional note for this status change..."
                className="w-full rounded-sm px-2 py-1.5 text-xs outline-none"
                style={{ background: t.paperDeep, border: `1px solid ${t.line}`, color: t.ink }}
              />
            </div>

            <div className="mt-3 rounded-sm px-4 py-3" style={{ background: t.paper, border: `1px solid ${t.line}` }}>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: t.ink }}>
                <Send size={13} /> Reply to citizen
              </p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Type a reply, or insert a draft template from the right..."
                className="mb-2 w-full rounded-sm px-2 py-1.5 text-xs outline-none"
                style={{ background: t.paperDeep, border: `1px solid ${t.line}`, color: t.ink }}
              />
              <button
                onClick={sendReply}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium"
                style={{ background: t.marigold, color: t.tealDeep }}
              >
                <Send size={12} /> Send reply
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.slate }}>
              <Building2 size={12} /> Draft reply templates
            </p>
            <DraftReplies replies={draftReplies} setReplies={setDraftReplies} officer={officer} onInsert={setReplyText} />
          </div>
        </div>
      )}

      {/* Audit log — Admin only */}
      {officer.role === "Admin" && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.slate }}>
              <ListChecks size={12} /> Audit trail
            </p>
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: "rgba(232,163,61,0.15)", color: t.marigold }}>
              <ShieldAlert size={12} /> {auditLog.length} logged actions
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-sm px-3 py-2" style={{ background: t.paper, border: `1px solid ${t.line}` }}>
            {auditLog.length === 0 && <p className="text-xs" style={{ color: t.slate }}>No officer actions logged yet.</p>}
            <ul className="space-y-1.5">
              {auditLog.slice().reverse().map((a, i) => (
                <li key={i} className="text-[11px]" style={{ color: t.slate }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatDate(a.date)}</span> — {a.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
