# Contributing New Schemes & Expanding Indian States

JanSahay AI separates **scheme/state data** from **application code**. Adding a new Indian state or a new government scheme is a **100% data-only change** — you do not need to edit React components or Express route handlers.

---

## 1. Adding a New State (Data-Only Change)

1. Register the state metadata in [`server/data/states.json`](../server/data/states.json):
   ```json
   {
     "code": "KA",
     "name": "Karnataka",
     "level": "STATE",
     "status": "ACTIVE",
     "portalName": "Seva Sindhu / Karnataka One",
     "portalUrl": "https://sevasindhugs.karnataka.gov.in",
     "rtsPortalUrl": "https://sakala.kar.nic.in"
   }
   ```
2. Create a state scheme data file at `server/data/states/<state-slug>.json` (for example `server/data/states/karnataka.json`) containing an array (or `{ "schemes": [...] }`) of verified scheme objects conforming to the canonical schema below.
3. On startup, `Database.init()` automatically loads `server/data/states.json` and merges all verified schemes in `server/data/states/*.json`. Both the API (`GET /api/schemes/meta/states`) and the React UI dropdowns (`ProfileWizardPage`, `SchemesCatalogPage`, `DocumentGuidesCatalogPage`) update dynamically from this data.

> **Important:** Do **not** set `"status": "ACTIVE"` on a state until at least one scheme or document guide with a verified `sourceUrl` and `lastVerifiedAt` has been added.

---

## 2. Canonical Structured Scheme Schema

Every verified scheme MUST define all 11 canonical fields below:

| Field | Type | Requirement |
| :--- | :--- | :--- |
| `name` | `string` | Official scheme title as gazetted / published on portal |
| `level` | `"CENTRAL" \| "STATE" \| "JOINT"` | Implementing tier (`governmentLevel` alias also supported) |
| `state` | `string` | `"All India"` for Central schemes, or exact State/UT name |
| `category` | `string` | e.g. `EDUCATION`, `AGRICULTURE`, `BUSINESS`, `HEALTH`, `WOMEN_EMPOWERMENT`, `HOUSING`, `WELFARE` |
| `rules` | `Array<object>` | Deterministic rules consumed by `EligibilityEngine` (`field`, `operator`, `value`, `description`) |
| `documents` | `Array<object>` | Required documents (`documentName`, `documentType`, `mandatory`) (`requiredDocuments` alias also supported) |
| `benefit` | `string` | Verified benefit summary cited from official guidelines |
| `officialUrl` | `string` | Official government scheme application / home URL (`https://...`) |
| `sourceUrl` | `string` | Exact official portal / gazette URL used to verify the rules (`https://...`) |
| `lastVerifiedAt` | `string` (`YYYY-MM-DD`) | Date a human reviewer verified all rules and amounts on the official portal |
| `verifiedBy` | `string` | Contributor handle or authority audit label |

---

## 3. Non-Negotiable Data Verification Rules

1. **Official Sources Only:** Use `.gov.in`, `.nic.in`, `.maharashtra.gov.in`, or explicit statutory portal domains (`mudra.org.in`, `standupmitra.in`, `jeevandayee.gov.in`, etc.). Never cite aggregator blogs or unverified news articles.
2. **Never Invent Eligibility or Amounts:** If an income cap, fee, or deadline is missing from the official PDF/portal, set `"verificationStatus": "UNVERIFIED"` and `"active": false`, store it in [`server/data/scheme-expansion-templates.json`](../server/data/scheme-expansion-templates.json), and list the open items for manual verification. Unverified schemes are automatically excluded from eligibility matching.
3. **180-Day Freshness Policy:** Any scheme whose `lastVerifiedAt` is more than **180 days** old triggers a staleness warning in CI. Re-verify official rules before updating `lastVerifiedAt`.

---

## 4. Validate Before Opening a Pull Request

Run the CI schema & freshness check from the repository root:

```bash
npm run validate:schemes
```

To fail locally on stale (>180 days) records as well:

```bash
node server/scripts/validate-schemes.js --strict-freshness
```
