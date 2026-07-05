/* ----------------------------------------------------------------
   OFFICER ACCOUNTS — DEMO ONLY
   Plaintext passwords here are for prototype login simulation only.
   In production: real backend auth (hashed + salted passwords, MFA,
   session tokens / OAuth, rate limiting) — never ship credentials
   in client-side source.

   Roles:
   - "Admin"              full access, manages officers & all depts
   - "Supervisor"         department-wide oversight, assigns officers
   - "Department Officer" handles own department's queue only
------------------------------------------------------------------ */
export const OFFICERS = [
  {
    id: "off-001",
    username: "admin",
    password: "Admin@123",
    name: "K. Rao",
    role: "Admin",
    departmentId: null, // Admin sees all departments
  },
  {
    id: "off-002",
    username: "supervisor.revenue",
    password: "Supervisor@123",
    name: "P. Naidu",
    role: "Supervisor",
    departmentId: "revenue",
  },
  {
    id: "off-003",
    username: "officer.revenue",
    password: "Officer@123",
    name: "S. Reddy",
    role: "Department Officer",
    departmentId: "revenue",
  },
  {
    id: "off-004",
    username: "officer.municipal",
    password: "Officer@123",
    name: "M. Iyer",
    role: "Department Officer",
    departmentId: "municipal",
  },
  {
    id: "off-005",
    username: "officer.grievance",
    password: "Officer@123",
    name: "A. Sharma",
    role: "Department Officer",
    departmentId: "grievance_cell",
  },
];

export function findOfficer(username, password) {
  return OFFICERS.find(
    (o) => o.username.toLowerCase() === username.trim().toLowerCase() && o.password === password
  );
}

export function officerCanSeeDepartment(officer, departmentId) {
  if (!officer) return false;
  if (officer.role === "Admin") return true;
  return officer.departmentId === departmentId;
}
