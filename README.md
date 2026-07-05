# Government AI Copilot — Enhanced Prototype

A citizen-facing AI service assistant plus an officer management portal, built as a
front-end prototype (React + Vite + Tailwind). All data — requests, officers, draft
replies, audit log — lives in in-memory React state seeded from `src/data/*`. There
is no backend; wiring this to a real database/API is the natural next step.

## Run it

```bash
npm install
npm run dev
```

## What's new in this version

**1. Preferred Languages** (`src/data/languages.js`, `src/data/translations.js`)
Sidebar (desktop) / dropdown (mobile) selector covering English, Hindi, Telugu,
Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, Odia, and
Assamese. Core UI chrome (nav labels, placeholders, headers) is translated for the
ten most-requested languages via `t(key, languageCode)`; languages without a full
dictionary fall back to English automatically. Chat *responses* stay in English in
this prototype — route them through a translation/localization service in
production to fully localize AI output.

**2. "Try Asking" suggestions** (`src/data/suggestions.js`, `src/data/intents.js`)
Expanded and grouped into categories (Identity Documents, Certificates, Transport &
Travel, Utilities & Welfare, Land & Property, Report an Issue) covering PAN, Aadhaar,
PAN–Aadhaar linking, ration card, income/caste/residence/birth/death certificates,
voter ID, driving licence, passport, pension, land records, electricity/water bills,
and property tax.

**3. Officer Authorization** (`src/utils/auth.js`, `src/data/officers.js`,
`src/components/LoginView.jsx`)
Username/password login gate for the Officer portal with a role-based access model
(Admin, Supervisor, Department Officer), a simulated "forgot password" flow, and a
session persisted in `localStorage` (client-side only — see security note below).

Demo accounts:
| Username | Password | Role | Department |
|---|---|---|---|
| `admin` | `Admin@123` | Admin | All |
| `supervisor.revenue` | `Supervisor@123` | Supervisor | Revenue |
| `officer.revenue` | `Officer@123` | Department Officer | Revenue |
| `officer.municipal` | `Officer@123` | Department Officer | Municipal Administration |
| `officer.grievance` | `Officer@123` | Department Officer | Public Grievance Cell |

**4. Draft Replies** (`src/data/draftReplies.js`, `src/components/DraftReplies.jsx`)
Officers can create, edit, delete, and categorize reusable reply templates by
department, then insert one directly into the reply box while handling a request.

**5. Request Tracking** (`src/utils/tracking.js`, `src/components/StatusTracker.jsx`,
`src/components/TrackingSearch.jsx`)
Every classified request gets a generated tracking ID (`DEPT-YEAR-#####`), a status
drawn from Submitted → Under Review → In Progress → Approved/Rejected → Completed,
a full timestamped activity history, an assigned-officer field, and an estimated
completion date. Citizens can search/filter by tracking ID, name, department, and
status under the **Track Application** tab; officers get the same detail view plus
status-change and reply controls in the dashboard.

**6. Departments module** (`src/data/departments.js`,
`src/components/DepartmentsPanel.jsx`)
All 27 requested departments plus a Public Grievance Cell and Election/Voter and
Passport bodies (30 total), each with a short description and the services routed
to it. Browsable under the **Departments** tab; clicking a service jumps into chat.

**7. UI/UX and engineering**
- Responsive: sidebar collapses to a mobile dropdown for language/quick-ask; tabs
  and tables wrap and scroll on small screens.
- Basic accessibility: labelled inputs, `aria-label`/`aria-pressed` on interactive
  controls.
- Input validation on the login and template forms; empty/whitespace guards on chat
  and reply submission.
- Audit trail (`auditLog` state, visible to Admins) records officer logins, status
  changes, and replies sent — a starting point for real audit logging.
- Modular structure (`data/`, `utils/`, `components/`) so new languages, intents,
  departments, or roles are additive, not rewrites.

## Known limitations / what a production build needs

- **No real backend.** Requests, officers, and templates reset on page reload.
  Replace the in-memory state in `App.jsx` with API calls to a real service.
- **Auth is client-side only** (`src/utils/officers.js` holds plaintext demo
  passwords, `localStorage` holds the session). This is fine for a demo, not for
  production — use real hashed-password auth, HTTPS-only sessions/JWTs, and MFA
  before handling real citizen or officer data.
- **Intent classification is keyword matching** (`utils/classifyIntent.js`), not a
  real NLU/LLM model.
- **Translations cover UI chrome only**, not generated chat content.
- **Notifications are simulated** (in-app toast) rather than real SMS/email/push.

## Legacy files

`GovAICopilot.jsx` (the original single-file version, pre-refactor) is superseded
by the modular `src/App.jsx` + `src/components/` + `src/data/` + `src/utils/`
structure above and isn't included in this delivery.
