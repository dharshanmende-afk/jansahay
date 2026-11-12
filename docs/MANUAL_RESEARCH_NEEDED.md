# Schemes & Freshness Requiring Manual Official Verification

Consistent with **JanSahay AI Non-Negotiable Rule #3 (Never invent government data)**, no unverified rules, benefit amounts, fees, or deadlines have been guessed or activated.

---

## 1. Unverified Multi-State Expansion Templates (15 Entries)

Stored in [`server/data/scheme-expansion-templates.json`](../server/data/scheme-expansion-templates.json) with `verificationStatus: "UNVERIFIED"` and `active: false` (excluded from eligibility results until verified on official portals):

| Template ID | Scheme Title | Jurisdiction | Official Portal to Verify Manually |
| :--- | :--- | :--- | :--- |
| `KA-GRUHA-LAKSHMI-01` | Gruha Lakshmi Scheme (Karnataka) | Karnataka | `sevasindhugs.karnataka.gov.in` |
| `KA-SHAKTI-YOJANA-02` | Shakti Free Bus Travel Scheme (Karnataka) | Karnataka | `sevasindhu.karnataka.gov.in` / `ksrtc.in` |
| `KA-YUVA-NIDHI-03` | Yuva Nidhi Scheme (Karnataka) | Karnataka | `sevasindhugs.karnataka.gov.in` |
| `GJ-MUKHYAMANTRI-YUVA-04` | Mukhyamantri Yuva Swavalamban Yojana (MYSY) | Gujarat | `mysy.guj.nic.in` |
| `GJ-NAMO-LAKSHMI-05` | Namo Lakshmi Yojana (Gujarat) | Gujarat | Gujarat Education Dept portal |
| `TN-KALAIGNAR-MAGALIR-06` | Kalaignar Magalir Urimai Thittam (KMUT) | Tamil Nadu | `kmut.tn.gov.in` |
| `TN-PUDHUMAI-PENN-07` | Pudhumai Penn Scheme (Tamil Nadu) | Tamil Nadu | `pms.tn.gov.in` / TN Social Welfare |
| `UP-KANYA-SUMANGALA-08` | Mukhyamantri Kanya Sumangala Yojana (UP) | Uttar Pradesh | `mksy.up.gov.in` |
| `UP-ABHYUDAYA-COACHING-09` | Mukhyamantri Abhyudaya Yojana (UP) | Uttar Pradesh | `abhyuday.up.gov.in` |
| `MP-LADLI-BEHNA-10` | Mukhyamantri Ladli Behna Yojana (MP) | Madhya Pradesh | `cmladlibahna.mp.gov.in` |
| `RJ-CHIRANJEEVI-RGHS-11` | Mukhyamantri Ayushman Arogya Yojana (Rajasthan) | Rajasthan | `maa.rajasthan.gov.in` |
| `WB-KANYASHREE-12` | Kanyashree Prakalpa (West Bengal) | West Bengal | `wbkanyashree.gov.in` |
| `TS-RYTHU-BHAROSA-13` | Rythu Bharosa Farmer Support (Telangana) | Telangana | Telangana Agriculture Dept portal |
| `BR-STUDENT-CREDIT-14` | Bihar Student Credit Card Yojana | Bihar | `7nishchay-yuvaupmission.bihar.gov.in` |
| `IN-PM-INTERNSHIP-15` | PM Internship Scheme (MCA) | All India | `pminternship.mca.gov.in` |

To activate any template above:
1. Verify current income limits, age limits, benefit amounts, and required documents directly from the official portal & gazette notifications.
2. Move the completed entry into `server/data/states/<state>.json`, register the state in `server/data/states.json`, set `verificationStatus: "VERIFIED"`, `active: true`, `lastVerifiedAt`, and `verifiedBy`.
3. Run `npm run validate:schemes`.

---

## 2. Existing Schemes Requiring Periodic (>180-Day) Re-Verification

Running `npm run validate:schemes` checks all **50 active verified schemes** (`All India` & `Maharashtra`). All 50 carry valid `sourceUrl` and `lastVerifiedAt` (`2026-03-01`), which is older than **180 days** relative to **2026-11-12** (`256 days old`). Re-verify rules/benefit ceilings on `mahadbt.maharashtra.gov.in`, `pmkisan.gov.in`, `ladakibahin.maharashtra.gov.in`, and `myscheme.gov.in` and bump `lastVerifiedAt` only after confirming each scheme's guidelines.
