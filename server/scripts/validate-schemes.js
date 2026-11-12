#!/usr/bin/env node
/**
 * validate-schemes.js — CI Scheme Data Schema & Freshness Validator (Phase 7)
 *
 * Validates that all active schemes conform to the canonical format:
 *   name, level, state, category, rules, documents, benefit,
 *   officialUrl, sourceUrl, lastVerifiedAt, verifiedBy
 *
 * Behaviour:
 *   - Fails CI (exit code 1) if `sourceUrl` or `lastVerifiedAt` is missing/invalid,
 *     or required structured fields are absent on any active scheme.
 *   - Emits clear staleness warnings when `lastVerifiedAt` is older than 180 days
 *     (fails if `--strict-freshness` CLI flag is passed).
 *   - Verifies that unverified templates in `scheme-expansion-templates.json` remain
 *     inactive (`active: false`, `verificationStatus: "UNVERIFIED"`).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialSeedData } from '../src/db/seedData.js';
import { normalizeSchemeRecord, loadExternalStateSchemes } from '../src/data/stateExpansionLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'jansahay-db.json');
const TEMPLATES_FILE = path.join(DATA_DIR, 'scheme-expansion-templates.json');

const STALE_DAYS_THRESHOLD = 180;
const strictFreshness = process.argv.includes('--strict-freshness');

function isValidHttpUrl(val) {
  if (!val || typeof val !== 'string') return false;
  try {
    const parsed = new URL(val.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function parseValidDate(val) {
  if (!val || typeof val !== 'string') return null;
  const ms = Date.parse(val.trim());
  if (Number.isNaN(ms)) return null;
  return new Date(ms);
}

export function validateSchemesDataset({ schemes, templates = [], now = new Date() }) {
  const errors = [];
  const staleWarnings = [];
  let activeCount = 0;

  for (const raw of schemes) {
    const s = normalizeSchemeRecord(raw);
    const label = `[Scheme #${s.id ?? '?'} "${s.name || 'UNNAMED'}"]`;

    // Skip intentionally unverified drafts from eligibility CI unless missing explicit unverified flag
    if (s.active === false && s.verificationStatus === 'UNVERIFIED') {
      continue;
    }

    activeCount++;

    if (!s.name || typeof s.name !== 'string' || !s.name.trim()) {
      errors.push(`${label} Missing required field: name`);
    }
    if (!['CENTRAL', 'STATE', 'JOINT'].includes(String(s.level || '').toUpperCase())) {
      errors.push(`${label} Invalid or missing level/governmentLevel: "${s.level}"`);
    }
    if (!s.state || typeof s.state !== 'string') {
      errors.push(`${label} Missing required field: state`);
    }
    if (!s.category || typeof s.category !== 'string') {
      errors.push(`${label} Missing required field: category`);
    }
    if (!Array.isArray(s.rules)) {
      errors.push(`${label} Field 'rules' must be an array`);
    }
    if (!Array.isArray(s.documents)) {
      errors.push(`${label} Field 'documents' / 'requiredDocuments' must be an array`);
    }
    if (!s.benefit || typeof s.benefit !== 'string' || !s.benefit.trim()) {
      errors.push(`${label} Missing required field: benefit`);
    }
    if (!isValidHttpUrl(s.sourceUrl)) {
      errors.push(`${label} Missing or invalid official sourceUrl: "${s.sourceUrl}"`);
    }
    if (!isValidHttpUrl(s.officialUrl)) {
      errors.push(`${label} Missing or invalid officialUrl: "${s.officialUrl}"`);
    }

    const verifiedDate = parseValidDate(s.lastVerifiedAt);
    if (!verifiedDate) {
      errors.push(`${label} Missing or invalid lastVerifiedAt date: "${s.lastVerifiedAt}"`);
    } else {
      const ageDays = Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (ageDays > STALE_DAYS_THRESHOLD) {
        staleWarnings.push({
          id: s.id,
          name: s.name,
          state: s.state,
          lastVerifiedAt: s.lastVerifiedAt,
          ageDays,
          sourceUrl: s.sourceUrl
        });
      }
    }

    if (!s.verifiedBy || typeof s.verifiedBy !== 'string') {
      errors.push(`${label} Missing required field: verifiedBy`);
    }
  }

  for (const tpl of templates) {
    if (tpl.active === true || tpl.verificationStatus === 'VERIFIED') {
      errors.push(`[Template "${tpl.templateId || tpl.name}"] Unverified expansion template cannot be marked active/VERIFIED in templates file.`);
    }
  }

  return {
    totalChecked: schemes.length,
    activeCount,
    templateCount: templates.length,
    errors,
    staleWarnings
  };
}

function runCli() {
  let schemes = [];
  if (fs.existsSync(DB_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    schemes = parsed.schemes || [];
  } else {
    schemes = initialSeedData.schemes || [];
  }

  const external = loadExternalStateSchemes();
  for (const ext of external) {
    if (!schemes.some(s => String(s.name).toLowerCase() === String(ext.name).toLowerCase())) {
      schemes.push(ext);
    }
  }

  let templates = [];
  if (fs.existsSync(TEMPLATES_FILE)) {
    const parsedT = JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf-8'));
    templates = parsedT.templates || [];
  }

  const report = validateSchemesDataset({ schemes, templates });

  console.log('==================================================================');
  console.log('🛡️  JanSahay AI — Scheme Schema & Freshness Validation Report');
  console.log('==================================================================');
  console.log(`   Active verified schemes checked : ${report.activeCount}`);
  console.log(`   Unverified research templates   : ${report.templateCount}`);
  console.log(`   Schema / citation errors        : ${report.errors.length}`);
  console.log(`   Stale warnings (>180 days)      : ${report.staleWarnings.length}`);

  if (report.errors.length > 0) {
    console.error('\n❌ Validation Errors (CI MUST FAIL):');
    for (const err of report.errors) {
      console.error(`   - ${err}`);
    }
  }

  if (report.staleWarnings.length > 0) {
    console.warn(`\n⚠️  Freshness Warning: ${report.staleWarnings.length} scheme(s) were last verified more than ${STALE_DAYS_THRESHOLD} days ago:`);
    for (const w of report.staleWarnings.slice(0, 10)) {
      console.warn(`   • [#${w.id}] ${w.name} (${w.state}) — verified ${w.lastVerifiedAt} (${w.ageDays} days old) -> ${w.sourceUrl}`);
    }
    if (report.staleWarnings.length > 10) {
      console.warn(`   ... and ${report.staleWarnings.length - 10} more older than ${STALE_DAYS_THRESHOLD} days.`);
    }
  }

  if (report.errors.length > 0 || (strictFreshness && report.staleWarnings.length > 0)) {
    process.exit(1);
  }

  console.log('\n✅ Scheme schema validation passed (all active schemes include valid sourceUrl & lastVerifiedAt).');
}

// Run CLI only when invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runCli();
}
