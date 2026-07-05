import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { t } from "../data/theme";
import { DEPARTMENTS, departmentName } from "../data/departments";
import { STATUS_FLOW } from "../data/intents";
import StatusTracker from "./StatusTracker";

/* ----------------------------------------------------------------
   TRACKING SEARCH — citizens look up any request by tracking ID,
   applicant name, department, or status.
------------------------------------------------------------------ */
export default function TrackingSearch({ requests }) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const results = useMemo(() => {
    return requests.filter((r) => {
      const matchesQuery =
        !query ||
        r.trackingId.toLowerCase().includes(query.toLowerCase()) ||
        r.citizen.toLowerCase().includes(query.toLowerCase());
      const matchesDept = dept === "all" || r.departmentId === dept;
      const matchesStatus = status === "all" || r.status === status;
      return matchesQuery && matchesDept && matchesStatus;
    });
  }, [requests, query, dept, status]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold" style={{ color: t.ink, fontFamily: "'Fraunces', serif" }}>
          Track Your Application
        </h2>
        <p className="text-xs" style={{ color: t.slate }}>
          Search by tracking ID or your name, or filter by department and status.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div
          className="flex min-w-[220px] flex-1 items-center gap-2 rounded-sm px-3 py-2"
          style={{ background: t.paper, border: `1px solid ${t.line}` }}
        >
          <Search size={14} style={{ color: t.slate }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tracking ID or applicant name..."
            aria-label="Search by tracking ID or applicant name"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: t.ink }}
          />
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          aria-label="Filter by department"
          className="rounded-sm px-2 py-2 text-xs"
          style={{ background: t.paper, border: `1px solid ${t.line}`, color: t.ink }}
        >
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-sm px-2 py-2 text-xs"
          style={{ background: t.paper, border: `1px solid ${t.line}`, color: t.ink }}
        >
          <option value="all">All statuses</option>
          {[...STATUS_FLOW, "Rejected"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <p className="text-xs" style={{ color: t.slate }}>No matching applications found.</p>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.trackingId}>
              <button
                onClick={() => setExpanded(expanded === r.trackingId ? null : r.trackingId)}
                className="flex w-full items-center justify-between rounded-sm px-4 py-2.5 text-left text-sm"
                style={{ background: t.paper, border: `1px solid ${t.line}`, color: t.ink }}
              >
                <span>
                  <span className="font-mono text-xs" style={{ color: t.slate }}>{r.trackingId}</span>{" "}
                  — {r.intentLabel} ({departmentName(r.departmentId)})
                </span>
                <span className="text-xs font-medium" style={{ color: t.teal }}>{r.status}</span>
              </button>
              {expanded === r.trackingId && <StatusTracker request={r} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
