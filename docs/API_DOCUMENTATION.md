# JanSahay 2.0 – REST API Documentation

All endpoints return a standardized JSON response envelope:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "timestamp": "2026-11-02T21:30:00.000"
}
```

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new citizen or administrator | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT bearer token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user details | Yes (Bearer JWT) |

### Sample Login Request:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@jansahay.gov.in",
  "password": "Password@123"
}
```

---

## 2. Schemes Directory (`/api/schemes`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/schemes` | List paginated schemes with keyword, category, state filters | No |
| `GET` | `/api/schemes/{id}` | Retrieve scheme details, eligibility rules, and required documents | No |
| `GET` | `/api/schemes/category/{cat}` | Filter schemes by category (`EDUCATION`, `AGRICULTURE`, etc.) | No |

### Query Parameters for `GET /api/schemes`:
- `keyword` (string): Search scheme name and benefits
- `category` (string): Scheme category
- `governmentLevel` (string): `CENTRAL` or `STATE`
- `state` (string): State filter (e.g. `Maharashtra`)
- `page` (int, default `0`), `size` (int, default `12`), `sortBy` (string, default `name`)

---

## 3. Citizen Profiles (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | Retrieve the authenticated citizen's profile | Yes |
| `POST` | `/api/profile` | Create or update citizen profile details | Yes |
| `GET` | `/api/profile/exists` | Check if profile is complete | Yes |

---

## 4. Recommendations (`/api/recommendations`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recommendations` | Retrieve evaluated schemes matching citizen profile | Yes |
| `POST` | `/api/recommendations/generate` | Trigger recalculation of recommendations | Yes |

---

## 5. Document Guidance & Checklist (`/api/documents`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents` | Get citizen's document status list | Yes |
| `PUT` | `/api/documents/status` | Update status of a specific document (`AVAILABLE`, `MISSING`, etc.) | Yes |
| `GET` | `/api/documents/preparation-dashboard` | Get readiness percentage and consolidated checklist | Yes |

---

## 6. Document Acquisition Guides (`/api/documents/guides`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents/guides` | List official certificate guides | No |
| `GET` | `/api/documents/guides/{id}` | Detailed guide with authority and statutory timelines | No |

---

## 7. AI Assistant (`/api/ai`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Multilingual assistant grounded in knowledge base | Optional |
| `POST` | `/api/ai/explain/{schemeId}` | Plain-language explanation of a specific scheme | Optional |

---

## 8. Government Updates (`/api/updates`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/updates` | Fetch recent government notifications and circulars | No |
