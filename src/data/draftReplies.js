/* ----------------------------------------------------------------
   DRAFT REPLIES — reusable response templates for officers
   `departmentId: null` means the template is available to all
   departments (general-purpose replies).
------------------------------------------------------------------ */
export const INITIAL_DRAFT_REPLIES = [
  {
    id: "dr-001",
    title: "Documents pending",
    departmentId: null,
    body:
      "Thank you for your application. One or more required documents are missing or unclear. Please re-upload the listed documents so we can proceed with verification.",
  },
  {
    id: "dr-002",
    title: "Under field verification",
    departmentId: "revenue",
    body:
      "Your application has been forwarded for field verification. This typically takes 5–7 working days. You will be notified once verification is complete.",
  },
  {
    id: "dr-003",
    title: "Approved — ready for collection",
    departmentId: null,
    body:
      "Your application has been approved. The certificate is ready. Please collect it from the office with your acknowledgment slip and original ID proof.",
  },
  {
    id: "dr-004",
    title: "Rejected — mismatch in records",
    departmentId: null,
    body:
      "Your application could not be approved due to a mismatch between the submitted documents and existing records. Please visit the office with original documents for correction.",
  },
  {
    id: "dr-005",
    title: "Grievance acknowledged",
    departmentId: "grievance_cell",
    body:
      "We've logged your complaint and assigned it to the relevant department. You'll receive updates as it progresses. Thank you for your patience.",
  },
  {
    id: "dr-006",
    title: "Birth/Death record correction needed",
    departmentId: "municipal",
    body:
      "There appears to be a discrepancy in the hospital record submitted. Please obtain a corrected record from the hospital/registrar and resubmit.",
  },
];
