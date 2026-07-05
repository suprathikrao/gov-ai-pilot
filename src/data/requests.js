import { intentById } from "./intents";
import { estimateCompletionDate } from "../utils/tracking";

/* ----------------------------------------------------------------
   SEED REQUESTS — mock in-memory "backend" for the prototype.
   Real deployment: this comes from the request/tracking database.
------------------------------------------------------------------ */
function seed(trackingId, citizen, intentId, status, daysAgo, assignedOfficer, extraHistory = []) {
  const intent = intentById(intentId);
  const submitted = new Date();
  submitted.setDate(submitted.getDate() - daysAgo);
  return {
    trackingId,
    citizen,
    intentId,
    intentLabel: intent.label,
    departmentId: intent.departmentId,
    language: "en",
    status,
    confidence: 88 + Math.floor(Math.random() * 10),
    submittedDate: submitted.toISOString(),
    estCompletion: estimateCompletionDate(intent.timeline, submitted).toISOString(),
    assignedOfficer,
    history: [
      { status: "Submitted", date: submitted.toISOString(), note: "Application received." },
      ...extraHistory,
    ],
  };
}

export const INITIAL_REQUESTS = [
  seed("REV-2026-2201", "R. Kumar", "income_cert", "Under Review", 4, "S. Reddy", [
    { status: "Under Review", date: new Date(Date.now() - 2 * 86400000).toISOString(), note: "Assigned for document verification." },
  ]),
  seed("GRI-2026-2202", "A. Sharma", "grievance", "In Progress", 3, "A. Sharma", [
    { status: "In Progress", date: new Date(Date.now() - 1 * 86400000).toISOString(), note: "Escalated to concerned department." },
  ]),
  seed("REV-2026-2203", "S. Reddy", "domicile", "Under Review", 6, "S. Reddy"),
  seed("MUN-2026-2204", "M. Iyer", "birth_cert", "Approved", 10, "M. Iyer", [
    { status: "Under Review", date: new Date(Date.now() - 7 * 86400000).toISOString(), note: "Hospital record verified." },
    { status: "Approved", date: new Date(Date.now() - 2 * 86400000).toISOString(), note: "Approved by registrar." },
  ]),
  seed("FIN-2026-2205", "P. Verma", "pan_apply", "Submitted", 1, null),
  seed("MUN-2026-2206", "K. Das", "property_tax", "Completed", 12, "M. Iyer", [
    { status: "Completed", date: new Date(Date.now() - 9 * 86400000).toISOString(), note: "Payment reconciled and receipt issued." },
  ]),
];
