import { STATUS_FLOW } from "../data/intents";

/* ----------------------------------------------------------------
   TRACKING HELPERS
   Generates human-readable tracking IDs and manages status history
   for the mock in-memory "backend" held in App.jsx state.
------------------------------------------------------------------ */
let counter = 2200;

export function generateTrackingId(departmentId) {
  counter += 1;
  const prefix = (departmentId || "GEN").slice(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${counter}`;
}

// Rough mock estimate: parses "7-10 working days" style strings into a date.
export function estimateCompletionDate(timelineText, fromDate = new Date()) {
  const match = timelineText && timelineText.match(/(\d+)\D+(\d+)?/);
  const days = match ? parseInt(match[2] || match[1], 10) : 10;
  const d = new Date(fromDate);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function createRequestRecord({ intent, citizenName = "You", language }) {
  const now = new Date();
  const trackingId = generateTrackingId(intent.departmentId);
  const estCompletion = estimateCompletionDate(intent.timeline, now);
  return {
    trackingId,
    citizen: citizenName,
    intentId: intent.id,
    intentLabel: intent.label,
    departmentId: intent.departmentId,
    language,
    status: STATUS_FLOW[0],
    confidence: 90 + Math.floor(Math.random() * 8),
    submittedDate: now.toISOString(),
    estCompletion: estCompletion.toISOString(),
    assignedOfficer: null,
    history: [
      { status: STATUS_FLOW[0], date: now.toISOString(), note: "Application received via AI Copilot." },
    ],
  };
}

export function advanceStatus(request, newStatus, note, officerName) {
  return {
    ...request,
    status: newStatus,
    assignedOfficer: officerName || request.assignedOfficer,
    history: [
      ...request.history,
      { status: newStatus, date: new Date().toISOString(), note: note || `Status updated to ${newStatus}.` },
    ],
  };
}

export function statusStepIndex(status) {
  const idx = STATUS_FLOW.indexOf(status);
  return idx === -1 ? 0 : idx;
}
