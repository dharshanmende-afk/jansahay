# JanSahay 2.0 – Database Design

## 1. Relational Schema (`jansahay_db`)

The database is built on **MySQL 8** with `utf8mb4` encoding to preserve multi-lingual Devanagari text (Marathi and Hindi) as well as English.

---

## 2. Table Specifications

### 2.1 `users`
Stores user credentials and authorization roles.
- `id` (BIGINT, Primary Key, Auto Increment)
- `name` (VARCHAR(100), Not Null)
- `email` (VARCHAR(150), Unique, Not Null)
- `password_hash` (VARCHAR(255), Not Null)
- `role` (ENUM: `CITIZEN`, `ADMIN`)
- `created_at`, `updated_at` (TIMESTAMP)

### 2.2 `user_profiles`
Stores personal and economic profile attributes for eligibility matching.
- `id` (BIGINT, Primary Key, Auto Increment)
- `user_id` (BIGINT, Foreign Key -> `users.id`, Unique)
- `date_of_birth` (DATE)
- `gender` (VARCHAR(20))
- `category` (ENUM: `OPEN`, `OBC`, `SC`, `ST`, `VJNT`, `EWS`)
- `state`, `district` (VARCHAR(100))
- `annual_income` (DECIMAL(12,2))
- `income_range` (ENUM: `BELOW_1_LAKH`, `BELOW_2_LAKH`, `BELOW_3_LAKH`, etc.)
- `occupation` (VARCHAR(100))
- `created_at`, `updated_at` (TIMESTAMP)

### 2.3 `schemes`
Central directory of welfare programs, benefits, and verified government links.
- `id` (BIGINT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), Not Null)
- `description` (TEXT)
- `government_level` (ENUM: `CENTRAL`, `STATE`)
- `state` (VARCHAR(100), Nullable for Central schemes)
- `category` (ENUM: `EDUCATION`, `AGRICULTURE`, `BUSINESS`, `HEALTHCARE`, `WELFARE`, etc.)
- `benefit` (TEXT, Not Null)
- `source_url` (VARCHAR(500))
- `last_verified` (DATE)
- `active` (BOOLEAN, Default: `true`)
- `is_demo_data` (BOOLEAN, Default: `false`)
- `created_at`, `updated_at` (TIMESTAMP)

### 2.4 `eligibility_rules`
Atomic, evaluatable conditions linked to schemes.
- `id` (BIGINT, Primary Key, Auto Increment)
- `scheme_id` (BIGINT, Foreign Key -> `schemes.id`)
- `field` (VARCHAR(50), e.g. `incomeRange`, `category`, `state`)
- `operator` (ENUM: `EQUALS`, `NOT_EQUALS`, `IN`, `GREATER_THAN`, `LESS_THAN`, etc.)
- `value` (VARCHAR(255))
- `description` (VARCHAR(255))
- `required` (BOOLEAN, Default: `true`)

### 2.5 `required_documents`
Documents mandatory for applying to a specific scheme.
- `id` (BIGINT, Primary Key, Auto Increment)
- `scheme_id` (BIGINT, Foreign Key -> `schemes.id`)
- `document_name` (VARCHAR(200), Not Null)
- `purpose` (VARCHAR(255))
- `required_flag` (BOOLEAN, Default: `true`)
- `description` (TEXT)

### 2.6 `document_guides`
Step-by-step acquisition instructions for state and central certificates.
- `id` (BIGINT, Primary Key, Auto Increment)
- `document_type` (VARCHAR(100), e.g. `INCOME_CERTIFICATE`, `DOMICILE_CERTIFICATE`)
- `title` (VARCHAR(255), Not Null)
- `description` (TEXT)
- `state` (VARCHAR(100))
- `issuing_authority` (VARCHAR(200))
- `expected_days` (INT, Delivery under Right to Services)
- `fee_details` (VARCHAR(200))
- `official_url` (VARCHAR(500))

### 2.7 `user_documents`
Citizen's personal document readiness tracking.
- `id` (BIGINT, Primary Key, Auto Increment)
- `user_id` (BIGINT, Foreign Key -> `users.id`)
- `document_name` (VARCHAR(200))
- `document_type` (VARCHAR(100))
- `status` (ENUM: `AVAILABLE`, `MISSING`, `IN_PROGRESS`, `EXPIRED`)
- `updated_at` (TIMESTAMP)

### 2.8 `government_updates`
Real official announcements and policy updates.
- `id` (BIGINT, Primary Key, Auto Increment)
- `title` (VARCHAR(255), Not Null)
- `description` (TEXT)
- `category` (VARCHAR(100))
- `source` (VARCHAR(150))
- `source_url` (VARCHAR(500))
- `published_date` (DATE)
- `active` (BOOLEAN)
- `created_at` (TIMESTAMP)
