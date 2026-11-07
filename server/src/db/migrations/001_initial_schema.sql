-- ==============================================================================
-- JanSahay AI - PostgreSQL Migration 001: Initial Relational Schema
-- ==============================================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'CITIZEN' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(50),
    category VARCHAR(50),
    annual_income NUMERIC(12, 2),
    state VARCHAR(100),
    district VARCHAR(100),
    occupation VARCHAR(100),
    landholding_acres NUMERIC(8, 2) DEFAULT 0,
    education_level VARCHAR(100),
    disability_status VARCHAR(50) DEFAULT 'NONE',
    marital_status VARCHAR(50),
    is_student BOOLEAN DEFAULT FALSE,
    in_hand_documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Schemes table
CREATE TABLE IF NOT EXISTS schemes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    code VARCHAR(100) UNIQUE,
    category VARCHAR(100) NOT NULL,
    department VARCHAR(255),
    level VARCHAR(50) DEFAULT 'Central',
    state VARCHAR(100),
    target_audience VARCHAR(255),
    summary TEXT,
    description TEXT,
    benefits TEXT,
    max_benefit_amount NUMERIC(14, 2),
    official_portal_url TEXT,
    application_steps JSONB DEFAULT '[]'::jsonb,
    required_documents JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Scheme Rules table
CREATE TABLE IF NOT EXISTS scheme_rules (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    field VARCHAR(100) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    value VARCHAR(255) NOT NULL,
    rule_group VARCHAR(50) DEFAULT 'DEFAULT',
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Document Guides table (9-point statutory RTS roadmaps)
CREATE TABLE IF NOT EXISTS document_guides (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(100) UNIQUE NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    statutory_sla_days INTEGER NOT NULL DEFAULT 15,
    government_fee NUMERIC(10, 2) DEFAULT 0,
    description TEXT,
    eligibility_summary TEXT,
    prerequisites_checklist JSONB DEFAULT '[]'::jsonb,
    application_steps JSONB DEFAULT '[]'::jsonb,
    common_pitfalls JSONB DEFAULT '[]'::jsonb,
    official_portal_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. User Documents table
CREATE TABLE IF NOT EXISTS user_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    document_number VARCHAR(100),
    issued_date DATE,
    validity_expiry_date DATE,
    verification_status VARCHAR(50) DEFAULT 'SELF_ATTESTED',
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_document_type UNIQUE (user_id, document_type)
);

-- 7. Policy Updates table
CREATE TABLE IF NOT EXISTS policy_updates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    source_url TEXT,
    source_department VARCHAR(255),
    category VARCHAR(100),
    urgency VARCHAR(50) DEFAULT 'NORMAL',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Chat Logs table
CREATE TABLE IF NOT EXISTS chat_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    sources_cited JSONB DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);
CREATE INDEX IF NOT EXISTS idx_schemes_level ON schemes(level);
CREATE INDEX IF NOT EXISTS idx_scheme_rules_scheme_id ON scheme_rules(scheme_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_guides_type ON document_guides(document_type);
CREATE INDEX IF NOT EXISTS idx_policy_updates_published ON policy_updates(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON chat_logs(session_id);
