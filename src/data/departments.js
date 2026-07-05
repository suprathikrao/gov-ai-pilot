/* ----------------------------------------------------------------
   GOVERNMENT DEPARTMENTS — master list
   Referenced by intents (departmentId), officer accounts, and the
   citizen-facing Departments browser.
------------------------------------------------------------------ */
export const DEPARTMENTS = [
  { id: "agriculture", name: "Agriculture", blurb: "Crop schemes, subsidies, farmer registration." },
  { id: "revenue", name: "Revenue", blurb: "Certificates, land revenue records, tehsildar services." },
  { id: "panchayat_raj", name: "Panchayat Raj & Rural Development", blurb: "Village governance and rural welfare schemes." },
  { id: "municipal", name: "Municipal Administration", blurb: "Urban civic services, birth/death registration, property tax." },
  { id: "health", name: "Health & Family Welfare", blurb: "Health schemes, hospital services, vaccination records." },
  { id: "education", name: "Education", blurb: "School/college admissions, scholarships, certificates." },
  { id: "social_welfare", name: "Social Welfare", blurb: "Welfare pensions, caste certificates, disability benefits." },
  { id: "wcd", name: "Women & Child Development", blurb: "Anganwadi services, maternity benefits, child protection." },
  { id: "transport", name: "Transport", blurb: "Driving licences, vehicle registration, permits." },
  { id: "civil_supplies", name: "Civil Supplies", blurb: "Ration cards, public distribution system." },
  { id: "labour", name: "Labour & Employment", blurb: "Labour registration, employment schemes, welfare boards." },
  { id: "police", name: "Police", blurb: "FIRs, character certificates, complaints." },
  { id: "forest", name: "Forest", blurb: "Forest produce permits, wildlife services." },
  { id: "fisheries", name: "Fisheries", blurb: "Fisherman ID, boat licensing, subsidies." },
  { id: "animal_husbandry", name: "Animal Husbandry", blurb: "Livestock health, veterinary services." },
  { id: "irrigation", name: "Irrigation", blurb: "Canal water access, irrigation scheme applications." },
  { id: "industries", name: "Industries & Commerce", blurb: "MSME registration, trade licences, incentives." },
  { id: "housing", name: "Housing", blurb: "Housing scheme applications, allotments." },
  { id: "tourism", name: "Tourism", blurb: "Tourism permits, guide licensing, heritage services." },
  { id: "energy", name: "Energy", blurb: "New electricity connections, bill services, subsidies." },
  { id: "finance", name: "Finance", blurb: "Treasury services, pension disbursal, financial grievances." },
  { id: "public_works", name: "Public Works", blurb: "Roads, buildings, infrastructure complaints." },
  { id: "registration_stamps", name: "Registration & Stamps", blurb: "Property registration, stamp duty, marriage registration." },
  { id: "it_dept", name: "Information Technology", blurb: "e-Governance services, digital service delivery." },
  { id: "food_safety", name: "Food Safety", blurb: "FSSAI licensing, food quality complaints." },
  { id: "disaster_mgmt", name: "Disaster Management", blurb: "Relief applications, disaster compensation." },
  { id: "environment", name: "Environment & Climate", blurb: "Pollution clearances, environmental complaints." },
  { id: "election", name: "Election / Voter Services", blurb: "Voter ID registration and corrections." },
  { id: "passport_regional", name: "Passport & External Affairs", blurb: "Passport issuance and renewal services." },
  { id: "grievance_cell", name: "Public Grievance Cell", blurb: "Cross-department complaints and escalations." },
];

export function departmentById(id) {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function departmentName(id) {
  return departmentById(id)?.name || id;
}
