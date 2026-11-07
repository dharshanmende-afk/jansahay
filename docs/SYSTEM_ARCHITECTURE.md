# JanSahay 2.0 – System Architecture

## 1. Overview
JanSahay 2.0 is an enterprise-grade citizen welfare discovery and document guidance platform developed specifically for Indian citizens. It features a high-performance **Java Spring Boot 3.x** backend coupled with a responsive **React 18** frontend, backed by **MySQL 8** for transactional persistence and deterministic rule evaluation.

---

## 2. Layered Architecture

```
+-------------------------------------------------------------+
|                     Client Layer (React 18)                 |
|  Vite | React Router | Tailwind / Custom CSS | Axios       |
+-------------------------------------------------------------+
                              |
                              | HTTP / REST (JWT in Headers)
                              v
+-------------------------------------------------------------+
|             Spring Boot Application (Port 8080)             |
|                                                             |
|  [Security Filter Chain] -> JwtAuthenticationFilter         |
|                                                             |
|  [Controllers]                                              |
|   - AuthController          - SchemeController              |
|   - ProfileController       - RecommendationController      |
|   - DocumentController      - AIController                  |
|   - AdminController         - UpdateController              |
|                                                             |
|  [Service Layer]                                            |
|   - EligibilityService (Deterministic matching engine)      |
|   - SchemeService (Catalog & filtering logic)               |
|   - AuthService (JWT generation, BCrypt authentication)     |
|   - AIService (Grounded Multilingual Assistant + Fallbacks) |
|   - DocumentService (Readiness & acquisition guidance)      |
|                                                             |
|  [Data Access Layer (Spring Data JPA / Hibernate)]          |
|   - SchemeRepository        - UserRepository                |
|   - ProfileRepository       - DocumentRepository            |
+-------------------------------------------------------------+
                              |
                              | JDBC (Port 3306)
                              v
+-------------------------------------------------------------+
|                Database Layer (MySQL 8)                     |
|  Database: jansahay_db                                      |
|  Tables: users, schemes, eligibility_rules,                 |
|          required_documents, document_guides, etc.          |
+-------------------------------------------------------------+
```

---

## 3. Core Subsystems

### 3.1 Deterministic Eligibility Engine (`EligibilityService`)
Evaluates citizen profile attributes (Age, Income Tier, Category/Caste, Education Level, State of Domicile, Landholding) against relational eligibility rule conditions (`EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN`, `IN`, `CONTAINS`). Provides rule-by-rule explainability:
- **Strong Match**
- **Potential Match**
- **More Information Required**
- **Not Eligible**

### 3.2 Grounded Multilingual AI Assistant (`AIService`)
- Operates in English, Marathi (मराठी), and Hindi (हिंदी).
- Grounded strictly in MySQL scheme and document guide records.
- Optional external LLM providers (Google Gemini / Groq) with fail-safe deterministic fallback. Never hallucinates eligibility or deadlines.

### 3.3 Security & Role-Based Access Control (`SecurityConfig`)
- Stateless authentication utilizing signed JSON Web Tokens (`HMAC-SHA512`).
- BCrypt password hashing (`strength 12`).
- Roles: `CITIZEN` and `ADMIN`.
