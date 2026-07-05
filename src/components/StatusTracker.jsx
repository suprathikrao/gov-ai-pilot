import React from "react";
import { CheckCircle2, Circle, XCircle, Clock, UserCog } from "lucide-react";
import { t, statusColor } from "../data/theme";
import { departmentName } from "../data/departments";
import { STATUS_FLOW } from "../data/intents";
import { formatDate, statusStepIndex } from "../utils/tracking";

/* ----------------------------------------------------------------
   STATUS TRACKER — shows a request's full timeline, department
   routing, officer assignment and estimated completion date.
------------------------------------------------------------------ */
export default function StatusTracker({ request }) {
  if (!request) return null;
  const rejected = request.status === "Rejected";
  const currentStep = statusStepIndex(request.status);

  return (
    <div className="mt-2 max-w-lg rounded-sm px-4 py-4" style={{ background: t.paper, border: `1px solid ${t.line}` }}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold" style={{ color: t.ink }}>
          {request.intentLabel}
        </p>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[10px]"
          style={{ background: t.paperDeep, color: t.slate }}
        >
          {request.trackingId}
        </span>
      </div>

      {rejected ? (
        <div className="mb-3 flex items-center gap-2 text-xs" style={{ color: t.coral }}>
          <XCircle size={16} /> Application rejected — see notes below.
        </div>
      ) : (
        <div className="mb-3 flex items-center">
          {STATUS_FLOW.map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                {i <= currentStep ? (
                  <CheckCircle2 size={16} style={{ color: t.sage }} />
                ) : (
                  <Circle size={16} style={{ color: t.line }} />
                )}
                <span
                  className="w-16 text-center text-[9px] leading-tight"
                  style={{ color: i <= currentStep ? t.ink : t.slate }}
                >
                  {step}
                </span>
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className="mx-1 h-[2px] flex-1" style={{ background: i < currentStep ? t.sage : t.line }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-1.5 border-t pt-2 text-[11px] sm:grid-cols-2" style={{ borderColor: t.line, color: t.slate }}>
        <div>Department: <span style={{ color: t.ink, fontWeight: 600 }}>{departmentName(request.departmentId)}</span></div>
        <div className="flex items-center gap-1">
          <UserCog size={12} /> Officer:{" "}
          <span style={{ color: t.ink, fontWeight: 600 }}>{request.assignedOfficer || "Not yet assigned"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} /> Est. completion:{" "}
          <span style={{ color: t.ink, fontWeight: 600 }}>{formatDate(request.estCompletion)}</span>
        </div>
        <div>
          Current status:{" "}
          <span style={{ color: statusColor(request.status), fontWeight: 600 }}>{request.status}</span>
        </div>
      </div>

      <div className="mt-3 border-t pt-2" style={{ borderColor: t.line }}>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.slate }}>
          Activity history
        </p>
        <ul className="space-y-1">
          {request.history.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: t.slate }}>
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: statusColor(h.status) }} />
              <span>
                <span style={{ color: t.ink, fontWeight: 600 }}>{h.status}</span> — {h.note}{" "}
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>({formatDate(h.date)})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
