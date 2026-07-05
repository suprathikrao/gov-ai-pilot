/* ----------------------------------------------------------------
   THEME — civic teal + marigold, distinct from a generic template
------------------------------------------------------------------ */
export const t = {
  teal: "#0F3D3E",
  tealDeep: "#092A2B",
  marigold: "#E8A33D",
  marigoldSoft: "#F3C378",
  paper: "#FAF6EE",
  paperDeep: "#F0E9D8",
  ink: "#22262A",
  slate: "#5D6B66",
  sage: "#6B8F71",
  coral: "#C65D4B",
  line: "#DCD3BC",
};

export function statusColor(status) {
  if (status === "Approved" || status === "Completed") return t.sage;
  if (status === "Rejected") return t.coral;
  return t.marigold; // Submitted / Under Review / In Progress
}
