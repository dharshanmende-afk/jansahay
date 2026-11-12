import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STATES_REGISTRY_FILE = path.join(DATA_DIR, 'states.json');
const STATES_SCHEMES_DIR = path.join(DATA_DIR, 'states');

/**
 * Normalizes a scheme object into the canonical structured format required by Phase 7:
 * { name, level, state, category, rules, documents, benefit, officialUrl, sourceUrl, lastVerifiedAt, verifiedBy }
 * Preserves legacy aliases (governmentLevel, requiredDocuments, lastVerified) for backward compatibility.
 */
export function normalizeSchemeRecord(scheme) {
  if (!scheme || typeof scheme !== 'object') return scheme;

  const level = scheme.level || scheme.governmentLevel || 'CENTRAL';
  const documents = Array.isArray(scheme.documents)
    ? scheme.documents
    : (Array.isArray(scheme.requiredDocuments) ? scheme.requiredDocuments : []);
  const sourceUrl = scheme.sourceUrl || scheme.officialUrl || '';
  const officialUrl = scheme.officialUrl || scheme.sourceUrl || '';
  const lastVerifiedAt = scheme.lastVerifiedAt || scheme.lastVerified || '';
  const lastVerified = scheme.lastVerified || scheme.lastVerifiedAt || '';

  return {
    ...scheme,
    level,
    governmentLevel: scheme.governmentLevel || level,
    state: scheme.state || (level === 'CENTRAL' ? 'All India' : 'Maharashtra'),
    documents,
    requiredDocuments: Array.isArray(scheme.requiredDocuments) ? scheme.requiredDocuments : documents,
    officialUrl,
    sourceUrl,
    lastVerifiedAt,
    lastVerified,
    verifiedBy: scheme.verifiedBy || (scheme.verificationStatus === 'VERIFIED' ? 'JanSahay Editorial Audit' : '')
  };
}

/**
 * Loads the data-only state registry from server/data/states.json.
 */
export function loadStatesRegistry() {
  try {
    if (!fs.existsSync(STATES_REGISTRY_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(STATES_REGISTRY_FILE, 'utf-8'));
    return Array.isArray(parsed.states) ? parsed.states : [];
  } catch (err) {
    console.warn('[StateExpansionLoader] Failed to read states.json:', err.message);
    return [];
  }
}

/**
 * Loads additional state-specific verified schemes from server/data/states/*.json.
 * Unverified entries (verificationStatus === 'UNVERIFIED' or active === false) are excluded from active results.
 */
export function loadExternalStateSchemes() {
  if (!fs.existsSync(STATES_SCHEMES_DIR)) return [];

  const collected = [];
  const files = fs.readdirSync(STATES_SCHEMES_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const fullPath = path.join(STATES_SCHEMES_DIR, file);
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.schemes) ? parsed.schemes : []);
      for (const item of list) {
        const normalized = normalizeSchemeRecord(item);
        if (normalized.active !== false && normalized.verificationStatus !== 'UNVERIFIED' && normalized.sourceUrl) {
          collected.push(normalized);
        }
      }
    } catch (err) {
      console.warn(`[StateExpansionLoader] Skipping malformed state file ${file}:`, err.message);
    }
  }
  return collected;
}

/**
 * Computes active supported states dynamically from states.json + active schemes + active guides.
 * Ensures adding a new state is a 100% data-only change with zero frontend/backend code edits.
 */
export function getSupportedStates(schemes = [], guides = []) {
  const registry = loadStatesRegistry();
  const stateMap = new Map();

  for (const s of registry) {
    if (s.status === 'ACTIVE' && s.name) {
      stateMap.set(s.name, {
        code: s.code || s.name.slice(0, 2).toUpperCase(),
        name: s.name,
        level: s.level || (s.name === 'All India' ? 'CENTRAL' : 'STATE'),
        portalName: s.portalName || '',
        portalUrl: s.portalUrl || '',
        rtsPortalUrl: s.rtsPortalUrl || '',
        schemeCount: 0,
        guideCount: 0
      });
    }
  }

  for (const scheme of schemes) {
    if (scheme.active === false || scheme.verificationStatus === 'UNVERIFIED') continue;
    const stateName = scheme.state || 'All India';
    if (!stateMap.has(stateName)) {
      stateMap.set(stateName, {
        code: stateName.slice(0, 2).toUpperCase(),
        name: stateName,
        level: stateName === 'All India' ? 'CENTRAL' : 'STATE',
        portalName: '',
        portalUrl: scheme.officialUrl || scheme.sourceUrl || '',
        rtsPortalUrl: '',
        schemeCount: 0,
        guideCount: 0
      });
    }
    stateMap.get(stateName).schemeCount += 1;
  }

  for (const guide of guides) {
    if (guide.publicationStatus === 'ARCHIVED') continue;
    const stateName = guide.applicableState || 'All India';
    if (!stateMap.has(stateName)) {
      stateMap.set(stateName, {
        code: stateName.slice(0, 2).toUpperCase(),
        name: stateName,
        level: stateName === 'All India' ? 'CENTRAL' : 'STATE',
        portalName: '',
        portalUrl: guide.officialInformationUrl || guide.officialApplicationUrl || '',
        rtsPortalUrl: guide.officialApplicationUrl || '',
        schemeCount: 0,
        guideCount: 0
      });
    }
    stateMap.get(stateName).guideCount += 1;
  }

  // Keep All India first, then Maharashtra, then alphabetical
  return Array.from(stateMap.values()).sort((a, b) => {
    if (a.name === 'Maharashtra' && b.name !== 'All India') return -1;
    if (b.name === 'Maharashtra' && a.name !== 'All India') return 1;
    if (a.name === 'All India') return -1;
    if (b.name === 'All India') return 1;
    return a.name.localeCompare(b.name);
  });
}
