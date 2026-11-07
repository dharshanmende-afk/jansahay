import { initialSeedData } from './seedData.js';
import pgClient, { runMigrations, checkPostgresConnectivity, getPgPool } from './pgClient.js';
import db from './database.js';
import dotenv from 'dotenv';

dotenv.config();

export const seedDatabase = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isPostgresUp = await checkPostgresConnectivity();

  console.log('==================================================================');
  console.log('🌱 JanSahay AI Database Seeder');
  console.log(`   Target Engine: ${isPostgresUp ? 'PostgreSQL 16 (Relational)' : 'Local JSON Fallback'}`);
  console.log(`   Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log('==================================================================');

  if (isPostgresUp) {
    console.log('[PostgreSQL] Initializing tables and running migrations...');
    await runMigrations();

    const pool = getPgPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Seed Users
      let usersToSeed = [];
      if (!isProduction) {
        usersToSeed = initialSeedData.users || [];
      }

      console.log(`[PostgreSQL] Seeding ${usersToSeed.length} users...`);
      for (const u of usersToSeed) {
        await client.query(
          `INSERT INTO users (id, name, email, password_hash, role)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name, role = EXCLUDED.role`,
          [u.id, u.name, u.email, u.passwordHash, u.role]
        );
      }
      if (usersToSeed.length > 0) {
        await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
      }

      // 2. Seed Schemes & Rules
      const schemes = initialSeedData.schemes || [];
      console.log(`[PostgreSQL] Seeding ${schemes.length} verified government schemes...`);

      for (const s of schemes) {
        const res = await client.query(
          `INSERT INTO schemes (id, name, code, category, department, level, state, target_audience, summary, description, benefits, max_benefit_amount, official_portal_url, application_steps, required_documents, last_verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               summary = EXCLUDED.summary,
               description = EXCLUDED.description,
               benefits = EXCLUDED.benefits,
               official_portal_url = EXCLUDED.official_portal_url,
               required_documents = EXCLUDED.required_documents,
               last_verified_at = EXCLUDED.last_verified_at
           RETURNING id`,
          [
            s.id,
            s.name,
            s.code || `SCHEME_${s.id}`,
            s.category || 'General',
            s.department || 'Government of India / State',
            s.level || 'Central',
            s.state || 'All India',
            s.targetAudience || 'Citizens',
            s.summary || s.description?.slice(0, 200) || '',
            s.description || '',
            s.benefits || '',
            s.maxBenefitAmount || 0,
            s.officialPortalUrl || s.applicationUrl || '',
            JSON.stringify(s.applicationSteps || []),
            JSON.stringify(s.requiredDocuments || []),
            s.lastVerifiedAt || new Date().toISOString()
          ]
        );

        // Seed scheme rules if present
        if (s.eligibilityRules && Array.isArray(s.eligibilityRules)) {
          for (const r of s.eligibilityRules) {
            await client.query(
              `INSERT INTO scheme_rules (scheme_id, field, operator, value, description, is_mandatory)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                res.rows[0].id,
                r.field || 'age',
                r.operator || 'EQUALS',
                String(r.value || ''),
                r.description || '',
                r.isMandatory !== false
              ]
            );
          }
        }
      }
      await client.query(`SELECT setval('schemes_id_seq', (SELECT MAX(id) FROM schemes))`);

      // 3. Seed Document Guides (9-Point Statutory RTS Guides)
      const guides = initialSeedData.documentGuides || [];
      console.log(`[PostgreSQL] Seeding ${guides.length} statutory RTS document guides...`);

      for (const g of guides) {
        await client.query(
          `INSERT INTO document_guides (
             id, document_type, document_name, issuing_authority, department,
             statutory_sla_days, government_fee, description, eligibility_summary,
             prerequisites_checklist, application_steps, common_pitfalls,
             official_portal_url, last_verified_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (document_type) DO UPDATE
           SET document_name = EXCLUDED.document_name,
               issuing_authority = EXCLUDED.issuing_authority,
               statutory_sla_days = EXCLUDED.statutory_sla_days,
               government_fee = EXCLUDED.government_fee,
               prerequisites_checklist = EXCLUDED.prerequisites_checklist,
               application_steps = EXCLUDED.application_steps,
               official_portal_url = EXCLUDED.official_portal_url,
               last_verified_at = EXCLUDED.last_verified_at`,
          [
            g.id,
            g.documentType,
            g.documentName,
            g.issuingAuthority || 'Tehsildar / District Magistrate / Authorized Center',
            g.department || 'Revenue & District Administration',
            g.statutorySlaDays || g.statutoryDays || 15,
            g.governmentFee || g.fee || 33.60,
            g.description || '',
            g.eligibilitySummary || '',
            JSON.stringify(g.prerequisitesChecklist || g.prerequisites || []),
            JSON.stringify(g.applicationSteps || g.steps || []),
            JSON.stringify(g.commonPitfalls || []),
            g.officialPortalUrl || g.portalUrl || '',
            g.lastVerifiedAt || new Date().toISOString()
          ]
        );
      }
      await client.query(`SELECT setval('document_guides_id_seq', (SELECT MAX(id) FROM document_guides))`);

      // 4. Seed Policy Updates
      const updates = initialSeedData.updates || [];
      console.log(`[PostgreSQL] Seeding ${updates.length} portal policy updates...`);
      for (const upd of updates) {
        await client.query(
          `INSERT INTO policy_updates (id, title, summary, source_url, source_department, category, urgency, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            upd.id,
            upd.title,
            upd.summary || '',
            upd.sourceUrl || '',
            upd.sourceDepartment || 'Government of India / State',
            upd.category || 'General',
            upd.urgency || 'NORMAL',
            upd.publishedAt || new Date().toISOString()
          ]
        );
      }
      if (updates.length > 0) {
        await client.query(`SELECT setval('policy_updates_id_seq', (SELECT MAX(id) FROM policy_updates))`);
      }

      await client.query('COMMIT');
      console.log('✅ [PostgreSQL] Database seeded successfully with all tables populated.');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ [PostgreSQL Seed Error]:', err);
      throw err;
    } finally {
      client.release();
    }
  } else {
    // Fallback: Populate local JSON database
    console.log('[Fallback] Populating local database file (jansahay-db.json)...');
    db.seedInitial();
  }

  if (!isProduction) {
    console.log('------------------------------------------------------------------');
    console.log('🔑 [DEV SEED CREDENTIALS] Terminal Access Log:');
    console.log('   • Admin:    admin@jansahay.gov.in (Admin@123)');
    console.log('   • Student:  student@jansahay.ai   (Student@123)');
    console.log('   • Farmer:   farmer@jansahay.ai    (Farmer@123)');
    console.log('   • Business: business@jansahay.ai  (Business@123)');
    console.log('------------------------------------------------------------------');
  }

  console.log('✨ Database seeding process complete.');
};

// Auto-run if executed directly via node
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Fatal Error]:', err);
      process.exit(1);
    });
}

export default seedDatabase;
