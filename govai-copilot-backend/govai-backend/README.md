# Government AI Copilot — Backend (Phase 1 + Phase 2 core)

FastAPI backend for the Government AI Copilot. This is **Phase 1 (foundation)**
plus the core of **Phase 2 (request flow)** and **Phase 3 (OCR)** from the
larger feature roadmap:

| Feature area | Status |
|---|---|
| DB schema (9 tables), migrations | ✅ Done |
| JWT auth + RBAC (citizen/officer/supervisor/admin) | ✅ Done |
| Submit Request + unique Request ID | ✅ Done |
| OCR (Tesseract) + editable extracted fields | ✅ Done (sync; move to a queue for scale) |
| Officer dashboard APIs (list/filter/detail/approve/reject/remarks) | ✅ Done |
| Citizen dashboard APIs (list mine, track, notifications) | ✅ Done |
| Real-time sync (WebSocket) | ✅ Done (single-process; see note below) |
| Audit logging | ✅ Done (append-only, every mutation logged) |
| AI response storage | ✅ Done (schema + storage; LangChain/Qdrant retrieval wiring is next phase) |
| LangChain + Qdrant RAG pipeline | ⏳ Not yet — schema/config placeholders are in, actual retrieval chain is Phase 5 |
| React frontend integration | ⏳ Not yet — this backend is ready to be called; the existing `govai-copilot-clean` frontend still runs on mock data until wired up |

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres, Qdrant, and the API (with migrations + demo-account
seeding run automatically). API docs: http://localhost:8000/docs

### Demo accounts (seeded automatically)

Same as the existing frontend prototype's demo accounts, so nothing changes
for anyone testing officer login:

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | Admin |
| `supervisor.revenue` | `Supervisor@123` | Supervisor |
| `officer.revenue` | `Officer@123` | Officer |
| `officer.municipal` | `Officer@123` | Officer |
| `officer.grievance` | `Officer@123` | Officer |

Citizens self-register via `POST /api/auth/register`.

## API overview

- `POST /api/auth/register` — citizen self-registration
- `POST /api/auth/login` — OAuth2 password flow, returns access + refresh JWT
- `POST /api/auth/refresh` — rotate tokens
- `POST /api/requests` — submit a request (citizen)
- `GET /api/requests/mine` — citizen's own requests
- `GET /api/requests` — officer/supervisor/admin: list all, filter by `status_filter`, `service_type`, `search`
- `GET /api/requests/{id}` — full detail (RBAC-checked)
- `PATCH /api/requests/{id}/status` — officer updates status + remarks → writes audit log + pushes WebSocket notification
- `POST /api/requests/{id}/documents` — upload + synchronous OCR
- `GET /api/requests/{id}/documents` — list documents for a request
- `GET/PUT /api/requests/{id}/documents/{doc_id}/ocr` — view / correct extracted fields
- `GET /api/notifications` — citizen's notification inbox
- `GET /api/audit-logs` — admin/supervisor only
- `GET /api/officers` — admin/supervisor only
- `WS /ws?token=<jwt>` — real-time push channel

## Wiring into the existing React frontend

The frontend at `govai-copilot-clean/` currently keeps all state in memory
(`src/App.jsx`, seeded from `src/data/*`). To connect it to this backend:

1. Replace `src/utils/auth.js`'s local check against `src/data/officers.js`
   with a call to `POST /api/auth/login`; store the returned JWT (not the
   whole user object) and decode `role` from it.
2. Replace the in-memory `requests` array in `App.jsx` with:
   - `GET /api/requests/mine` (citizen) or `GET /api/requests` (officer) on mount
   - `POST /api/requests` when `StatusTracker`/chat flow currently pushes a
     new request into local state
3. Open a `new WebSocket(`ws://localhost:8000/ws?token=${accessToken}`)` in a
   top-level provider; on `{event: "notification", ...}` messages, update the
   relevant request's status in React state and show a toast (you already
   have toast plumbing per the README).
4. For OCR: add the file input to `DocumentChecklist.jsx`, `POST` to
   `/api/requests/{id}/documents`, and render the returned `extracted_fields`
   as editable inputs that `PUT` back to `.../ocr` before final submit.

This keeps the existing component structure (`OfficerView`, `StatusTracker`,
`TrackingSearch`, `DraftReplies`, etc.) — only the data source changes from
`src/data/*` mocks to these API calls.

## Notes and next steps

- **OCR runs synchronously** in the request/response cycle for simplicity.
  Under real load, move `run_ocr_pipeline()` (in `app/services/ocr_service.py`)
  behind a task queue (Celery/RQ/arq) and notify completion over the
  WebSocket channel instead of blocking the upload response.
- **WebSocket manager is in-memory / single-process** (`app/services/ws_manager.py`).
  For multi-instance deployment, back it with Redis pub/sub — the
  connect/disconnect/send_to_user interface won't need to change for callers.
- **Aadhaar numbers are stored masked only** (`mask_aadhaar()` in
  `ocr_service.py`) — never persist the full number in plaintext.
- **LangChain + Qdrant retrieval** (Phase 5) is not implemented yet — only
  config placeholders (`QDRANT_URL`, `LLM_MODEL`, etc. in `.env.example`) and
  the `ai_responses` table to store results once that chain exists. Building
  that chain requires deciding on your embedding model and how the citizen's
  original AI chat response gets generated in the first place — happy to
  build this next once Phases 1-4 are validated.
- **Rate limiting** is applied globally per-IP (`slowapi`, see `.env`
  `RATE_LIMIT_PER_MINUTE`). Tighten per-route (e.g. stricter on
  `/api/auth/login`) as needed.
- Run `alembic revision --autogenerate -m "..."` for any future schema
  changes rather than hand-editing `0001_initial_schema.py`.
