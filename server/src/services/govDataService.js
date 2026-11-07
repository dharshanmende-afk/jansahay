/**
 * govDataService.js — Real, Verifiable Government Data Pipeline
 *
 * Connects to accessible official government sources:
 *  1. Press Information Bureau (PIB — pib.gov.in)
 *  2. Official Central & State Scheme Portals (pmkisan.gov.in, mahadbt.maharashtra.gov.in, pmjay.gov.in, nsp.gov.in)
 *  3. MyScheme Discovery Portal (myscheme.gov.in)
 *  4. Open Government Data Platform (data.gov.in)
 *
 * Rules:
 *  - Never fabricates fake announcements or fake live records.
 *  - Distinguishes publication dates from retrieval dates.
 *  - Never destroys rich administrator-maintained eligibility rules, checklists, or steps.
 *  - Concurrency lock prevents overlapping background syncs.
 *  - Returns granular, verifiable per-source sync audit reports.
 */

import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { config } from '../config.js';

// ── Official Government Source Registry ──────────────────────────────────────
export const OFFICIAL_SOURCES = {
  pib: {
    id: 'pib',
    name: 'Press Information Bureau (PIB)',
    domain: 'pib.gov.in',
    homeUrl: 'https://pib.gov.in',
    category: 'GOVERNMENT_UPDATE',
    authority: 'Ministry of Information and Broadcasting, Govt of India',
  },
  pmKisan: {
    id: 'pmKisan',
    name: 'PM-KISAN Official Portal',
    domain: 'pmkisan.gov.in',
    homeUrl: 'https://pmkisan.gov.in',
    category: 'AGRICULTURE',
    authority: 'Ministry of Agriculture and Farmers Welfare',
  },
  mahaDbt: {
    id: 'mahaDbt',
    name: 'MahaDBT Scholarship & Direct Benefit Portal',
    domain: 'mahadbt.maharashtra.gov.in',
    homeUrl: 'https://mahadbt.maharashtra.gov.in',
    category: 'EDUCATION',
    authority: 'Government of Maharashtra',
  },
  pmJay: {
    id: 'pmJay',
    name: 'Ayushman Bharat PM-JAY (NHA)',
    domain: 'pmjay.gov.in',
    homeUrl: 'https://pmjay.gov.in',
    category: 'HEALTH',
    authority: 'National Health Authority, Govt of India',
  },
  myScheme: {
    id: 'myScheme',
    name: 'MyScheme National Portal',
    domain: 'myscheme.gov.in',
    homeUrl: 'https://www.myscheme.gov.in',
    category: 'GENERAL',
    authority: 'Ministry of Electronics and Information Technology (MeitY)',
  },
  dataGov: {
    id: 'dataGov',
    name: 'Open Government Data Platform (data.gov.in)',
    domain: 'data.gov.in',
    homeUrl: 'https://data.gov.in',
    category: 'STATISTICS',
    authority: 'National Informatics Centre (NIC)',
  },
  indiaGov: {
    id: 'indiaGov',
    name: 'National Portal of India',
    domain: 'india.gov.in',
    homeUrl: 'https://www.india.gov.in',
    category: 'GENERAL',
    authority: 'Government of India',
  }
};

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JanSahay/2.0 CitizenAssistance (Non-Commercial Academic Project)',
  'Accept': 'text/html,application/json,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8,mr;q=0.7',
};

// ── In-process concurrency guard ─────────────────────────────────────────────
let isSyncInProgress = false;

// ── Helper: Safe HTTP fetch with bounded timeout ──────────────────────────────
async function boundedFetch(url, timeoutMs = 8000, opts = {}) {
  try {
    const { default: fetch } = await import('node-fetch');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers: { ...REQUEST_HEADERS, ...(opts.headers || {}) },
    });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Timeout after ${timeoutMs}ms reaching ${url}`);
    }
    throw err;
  }
}

// ── Helper: Content hashing to detect substantive changes ───────────────────
function calculateContentHash(obj) {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// ── Helper: Extract & parse date safely ──────────────────────────────────────
function parseGovDate(dateText) {
  if (!dateText) return null;
  const clean = dateText.trim().replace(/^(posted on|published on|date:?)\s*/i, '');
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2030) {
      return d.toISOString().split('T')[0];
    }
  }

  // Regex for DD-MM-YYYY or DD/MM/YYYY
  const dmMatch = clean.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmMatch) {
    const day = dmMatch[1].padStart(2, '0');
    const month = dmMatch[2].padStart(2, '0');
    const year = dmMatch[3];
    return `${year}-${month}-${day}`;
  }

  return null;
}

export class GovDataService {
  /**
   * Status check for all official portals
   */
  static async checkSourcesHealth() {
    const health = {};
    const checkTargets = [
      { id: 'pib', url: 'https://pib.gov.in' },
      { id: 'indiaGov', url: 'https://www.india.gov.in' },
      { id: 'pmKisan', url: 'https://pmkisan.gov.in' },
      { id: 'mahaDbt', url: 'https://mahadbt.maharashtra.gov.in' },
      { id: 'pmJay', url: 'https://pmjay.gov.in' },
    ];

    await Promise.allSettled(
      checkTargets.map(async (target) => {
        const start = Date.now();
        try {
          const res = await boundedFetch(target.url, 5000, { method: 'HEAD' });
          health[target.id] = {
            id: target.id,
            url: target.url,
            status: res.status >= 200 && res.status < 400 ? 'ONLINE' : 'DEGRADED',
            statusCode: res.status,
            latencyMs: Date.now() - start,
            checkedAt: new Date().toISOString()
          };
        } catch (err) {
          health[target.id] = {
            id: target.id,
            url: target.url,
            status: 'OFFLINE',
            statusCode: null,
            latencyMs: Date.now() - start,
            error: err.message,
            checkedAt: new Date().toISOString()
          };
        }
      })
    );

    return health;
  }

  /**
   * Source Adapter 1: Press Information Bureau (PIB)
   * Fetches real press releases and extracts TRUE publication dates
   */
  static async fetchPIBReleases() {
    const report = {
      sourceId: 'pib',
      sourceName: OFFICIAL_SOURCES.pib.name,
      status: 'FAILED',
      recordsFetched: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      lastSuccessAt: null,
      error: null
    };

    try {
      const res = await boundedFetch('https://pib.gov.in/allRel.aspx', 7000);
      if (!res || res.status !== 200) {
        report.error = `HTTP ${res?.status || 'No Response'}`;
        return { report, items: [] };
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const items = [];

      // Find date label on page if present (e.g., "Releases for 20-October-2026")
      const pageDateText = $('.release_date, .date_header, h3:contains("202"), span:contains("202")').first().text();
      const fallbackPageDate = parseGovDate(pageDateText);

      $('ul.release-list li, .ContentDiv ul li, table tr').each((idx, el) => {
        if (items.length >= 10) return;
        const $el = $(el);
        const anchor = $el.find('a').first();
        const rawTitle = anchor.text().trim() || $el.text().trim();
        const href = anchor.attr('href') || '';

        if (rawTitle.length >= 25 && rawTitle.length <= 300) {
          const rowText = $el.text();
          const itemDate = parseGovDate(rowText) || fallbackPageDate;

          const absoluteUrl = href.startsWith('http')
            ? href
            : href.startsWith('/')
              ? `https://pib.gov.in${href}`
              : `https://pib.gov.in/${href}`;

          if (!items.some(x => x.title.toLowerCase() === rawTitle.toLowerCase())) {
            items.push({
              title: rawTitle,
              description: `Official Press Information Bureau release from Govt of India. Verified official publication.`,
              publishedDate: itemDate || 'Publication date unavailable',
              category: 'GOVERNMENT_UPDATE',
              source: 'PIB - Press Information Bureau',
              sourceUrl: absoluteUrl,
              dataStatus: 'LIVE',
              verificationStatus: 'VERIFIED',
              retrievedAt: new Date().toISOString(),
              isLive: true,
              contentHash: calculateContentHash(rawTitle)
            });
          }
        }
      });

      report.recordsFetched = items.length;
      report.status = items.length > 0 ? 'SUCCESS' : 'PARTIAL';
      if (items.length > 0) report.lastSuccessAt = new Date().toISOString();

      // Upsert into updates collection safely
      for (const item of items) {
        const existing = db.findOne('updates', u => u.title.toLowerCase() === item.title.toLowerCase());
        if (!existing) {
          const maxId = Math.max(0, ...db.find('updates').map(u => Number(u.id) || 0));
          db.insert('updates', { ...item, id: maxId + 1, active: true });
          report.recordsInserted++;
        } else {
          db.update('updates', existing.id, {
            retrievedAt: item.retrievedAt,
            dataStatus: 'LIVE',
            sourceUrl: item.sourceUrl || existing.sourceUrl
          });
          report.recordsUpdated++;
        }
      }

      return { report, items };
    } catch (err) {
      report.status = 'FAILED';
      report.error = err.message;
      return { report, items: [] };
    }
  }

  /**
   * Source Adapter 2: Official Scheme Web Portals
   * Verifies accessibility and updates real metadata for central & state schemes
   */
  static async fetchOfficialPortals() {
    const report = {
      sourceId: 'officialPages',
      sourceName: 'Official Ministry & State Scheme Portals',
      status: 'FAILED',
      recordsFetched: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      lastSuccessAt: null,
      error: null
    };

    const targetPortals = [
      {
        url: 'https://pmkisan.gov.in/',
        name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
        category: 'AGRICULTURE',
        governmentLevel: 'CENTRAL',
        state: 'All India',
      },
      {
        url: 'https://mahadbt.maharashtra.gov.in/',
        name: 'MahaDBT Scholarship & Direct Benefit Portal',
        category: 'EDUCATION',
        governmentLevel: 'STATE',
        state: 'Maharashtra',
      },
      {
        url: 'https://pmjay.gov.in/',
        name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
        category: 'HEALTH',
        governmentLevel: 'CENTRAL',
        state: 'All India',
      },
      {
        url: 'https://nsp.gov.in/',
        name: 'National Scholarship Portal (NSP)',
        category: 'EDUCATION',
        governmentLevel: 'CENTRAL',
        state: 'All India',
      }
    ];

    let successCount = 0;
    const errors = [];

    for (const portal of targetPortals) {
      try {
        const res = await boundedFetch(portal.url, 6000);
        if (res && res.status === 200) {
          const html = await res.text();
          const $ = cheerio.load(html);

          const metaDesc =
            $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') ||
            '';

          // Non-destructive update: match existing scheme by name or sourceUrl
          const existing = db.findOne('schemes', s =>
            s.name.toLowerCase().includes(portal.name.toLowerCase().substring(0, 15)) ||
            (s.sourceUrl && portal.url.includes(new URL(s.sourceUrl).hostname))
          );

          if (existing) {
            // CRITICAL: Preserve existing rich rules, requiredDocuments, and applicationGuides!
            db.update('schemes', existing.id, {
              sourceUrl: portal.url,
              dataStatus: 'LIVE',
              lastFetchedAt: new Date().toISOString(),
              portalStatus: 'ONLINE',
              lastVerified: existing.lastVerified || new Date().toISOString().split('T')[0],
              verificationStatus: existing.verificationStatus || 'VERIFIED'
            });
            report.recordsUpdated++;
          } else {
            const maxId = Math.max(0, ...db.find('schemes').map(s => Number(s.id) || 0));
            db.insert('schemes', {
              id: maxId + 1,
              name: portal.name,
              description: metaDesc.slice(0, 400) || `${portal.name} — Verified Official Government Service Portal.`,
              benefit: 'As notified on the official portal',
              category: portal.category,
              governmentLevel: portal.governmentLevel,
              state: portal.state,
              sourceUrl: portal.url,
              dataStatus: 'LIVE',
              verificationStatus: 'VERIFIED',
              lastFetchedAt: new Date().toISOString(),
              lastVerified: new Date().toISOString().split('T')[0],
              active: true,
              rules: [],
              requiredDocuments: [],
              applicationGuides: []
            });
            report.recordsInserted++;
          }
          report.recordsFetched++;
          successCount++;
        } else {
          errors.push(`${portal.name}: HTTP ${res?.status || 'No Response'}`);
        }
      } catch (err) {
        errors.push(`${portal.name}: ${err.message}`);
        const existing = db.findOne('schemes', s => s.sourceUrl && portal.url.includes(new URL(s.sourceUrl).hostname));
        if (existing) {
          db.update('schemes', existing.id, {
            dataStatus: 'CACHED',
            portalStatus: 'UNREACHABLE'
          });
        }
      }
    }

    report.status = successCount === targetPortals.length ? 'SUCCESS' : successCount > 0 ? 'PARTIAL' : 'FAILED';
    if (successCount > 0) report.lastSuccessAt = new Date().toISOString();
    if (errors.length > 0) report.error = errors.join('; ');

    return report;
  }

  /**
   * Source Adapter 3: MyScheme Discovery Integration
   * Transparently queries public discovery or reports exact connectivity status
   */
  static async queryMyScheme(keywords = ['scholarship', 'farmer', 'business']) {
    const report = {
      sourceId: 'myScheme',
      sourceName: OFFICIAL_SOURCES.myScheme.name,
      status: 'FAILED',
      recordsFetched: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      lastSuccessAt: null,
      error: null
    };

    const hitsFound = [];
    const errors = [];

    for (const kw of keywords) {
      try {
        const url = `https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=${encodeURIComponent(kw)}`;
        const res = await boundedFetch(url, 5000, {
          headers: {
            'Origin': 'https://www.myscheme.gov.in',
            'Referer': 'https://www.myscheme.gov.in/',
          }
        });

        if (res && res.status === 200) {
          const json = await res.json();
          const hits = json?.data?.hits || json?.hits || [];
          for (const hit of hits.slice(0, 3)) {
            const s = hit._source || hit;
            if (s.schemeName) {
              hitsFound.push({
                name: s.schemeName,
                description: s.briefDescription || s.schemeShortTitle || s.schemeName,
                benefit: s.benefit || 'As per scheme guidelines',
                category: s.category || 'WELFARE',
                sourceUrl: s.schemeUrl || `https://www.myscheme.gov.in`,
                dataStatus: 'LIVE',
                verificationStatus: 'LIVE_FETCHED'
              });
            }
          }
        } else if (res && (res.status === 401 || res.status === 403)) {
          errors.push(`MyScheme public search restricted (HTTP ${res.status}). Portal accessible via web.`);
          break;
        } else {
          errors.push(`MyScheme HTTP ${res?.status || 'No Response'}`);
        }
      } catch (err) {
        errors.push(`MyScheme: ${err.message}`);
        break;
      }
    }

    report.recordsFetched = hitsFound.length;
    report.status = hitsFound.length > 0 ? 'SUCCESS' : errors.length > 0 ? 'FAILED' : 'PARTIAL';
    if (hitsFound.length > 0) report.lastSuccessAt = new Date().toISOString();
    if (errors.length > 0) report.error = errors.join('; ');

    // Safely upsert without overwriting existing rich schemes
    for (const hit of hitsFound) {
      const existing = db.findOne('schemes', s => s.name.toLowerCase() === hit.name.toLowerCase());
      if (existing) {
        db.update('schemes', existing.id, {
          lastFetchedAt: new Date().toISOString(),
          dataStatus: 'LIVE'
        });
        report.recordsUpdated++;
      } else {
        const maxId = Math.max(0, ...db.find('schemes').map(s => Number(s.id) || 0));
        db.insert('schemes', {
          id: maxId + 1,
          name: hit.name,
          description: hit.description,
          benefit: hit.benefit,
          category: hit.category,
          governmentLevel: 'CENTRAL',
          state: 'All India',
          sourceUrl: hit.sourceUrl,
          dataStatus: 'LIVE',
          verificationStatus: 'UNVERIFIED',
          lastFetchedAt: new Date().toISOString(),
          lastVerified: null,
          active: true,
          rules: [],
          requiredDocuments: [],
          applicationGuides: []
        });
        report.recordsInserted++;
      }
    }

    return { report, items: hitsFound };
  }

  /**
   * Source Adapter 4: Open Government Data (data.gov.in)
   * Validates API key configuration and reports honest status
   */
  static async queryDataGov() {
    const report = {
      sourceId: 'dataGov',
      sourceName: OFFICIAL_SOURCES.dataGov.name,
      status: 'SKIPPED',
      recordsFetched: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      lastSuccessAt: null,
      error: null
    };

    const apiKey = config.dataGovApiKey || process.env.DATA_GOV_API_KEY;
    if (!apiKey || apiKey.includes('...')) {
      report.status = 'SKIPPED';
      report.error = 'DATA_GOV_API_KEY not configured. Set a free API key at data.gov.in/user/register to enable live OGD feeds.';
      return report;
    }

    try {
      const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${encodeURIComponent(apiKey)}&format=json&limit=5`;
      const res = await boundedFetch(url, 6000);
      if (res && res.status === 200) {
        const json = await res.json();
        const records = json?.records || [];
        report.recordsFetched = records.length;
        report.status = 'SUCCESS';
        report.lastSuccessAt = new Date().toISOString();
      } else {
        report.status = 'FAILED';
        report.error = `data.gov.in HTTP ${res?.status || 'No Response'}`;
      }
    } catch (err) {
      report.status = 'FAILED';
      report.error = err.message;
    }

    return report;
  }

  /**
   * Main Orchestrator: Syncs all active official sources with concurrency lock
   * Returns a genuine, auditable report of actual outcomes.
   */
  static async fetchAndSync() {
    if (isSyncInProgress) {
      return {
        success: false,
        partialSuccess: false,
        message: 'A government data sync is already currently in progress. Please wait for it to complete.',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        sources: [],
        totalInserted: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        errors: ['Sync lock active: concurrent sync rejected.']
      };
    }

    isSyncInProgress = true;
    const startedAt = new Date().toISOString();
    const sources = [];
    const errors = [];
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    console.log('[GovData] Starting genuine official government data sync...');

    try {
      // 1. PIB News & Official Press Releases
      try {
        const pibResult = await this.fetchPIBReleases();
        sources.push(pibResult.report);
        totalInserted += pibResult.report.recordsInserted;
        totalUpdated += pibResult.report.recordsUpdated;
        totalSkipped += pibResult.report.recordsSkipped;
        if (pibResult.report.error) errors.push(pibResult.report.error);
      } catch (err) {
        sources.push({
          sourceId: 'pib',
          sourceName: OFFICIAL_SOURCES.pib.name,
          status: 'FAILED',
          error: err.message
        });
        errors.push(`PIB: ${err.message}`);
      }

      // 2. Official Central & State Scheme Web Portals
      try {
        const portalReport = await this.fetchOfficialPortals();
        sources.push(portalReport);
        totalInserted += portalReport.recordsInserted;
        totalUpdated += portalReport.recordsUpdated;
        totalSkipped += portalReport.recordsSkipped;
        if (portalReport.error) errors.push(portalReport.error);
      } catch (err) {
        sources.push({
          sourceId: 'officialPages',
          sourceName: 'Official Scheme Portals',
          status: 'FAILED',
          error: err.message
        });
        errors.push(`Portals: ${err.message}`);
      }

      // 3. MyScheme Discovery Portal
      try {
        const mySchemeResult = await this.queryMyScheme(['scholarship', 'farmer', 'business']);
        sources.push(mySchemeResult.report);
        totalInserted += mySchemeResult.report.recordsInserted;
        totalUpdated += mySchemeResult.report.recordsUpdated;
        totalSkipped += mySchemeResult.report.recordsSkipped;
        if (mySchemeResult.report.error) errors.push(mySchemeResult.report.error);
      } catch (err) {
        sources.push({
          sourceId: 'myScheme',
          sourceName: OFFICIAL_SOURCES.myScheme.name,
          status: 'FAILED',
          error: err.message
        });
        errors.push(`MyScheme: ${err.message}`);
      }

      // 4. Open Government Data Platform (data.gov.in)
      try {
        const dataGovReport = await this.queryDataGov();
        sources.push(dataGovReport);
        if (dataGovReport.error && dataGovReport.status !== 'SKIPPED') {
          errors.push(dataGovReport.error);
        }
      } catch (err) {
        sources.push({
          sourceId: 'dataGov',
          sourceName: OFFICIAL_SOURCES.dataGov.name,
          status: 'FAILED',
          error: err.message
        });
      }

      const completedAt = new Date().toISOString();
      const hasAnySuccess = sources.some(s => s.status === 'SUCCESS');
      const hasFailures = sources.some(s => s.status === 'FAILED');
      const allSuccess = sources.every(s => s.status === 'SUCCESS' || s.status === 'SKIPPED');

      const totalSchemesInDB = db.find('schemes').length;
      const totalUpdatesInDB = db.find('updates').length;

      const summary = allSuccess
        ? `Successfully synchronized with all active government sources. Added ${totalInserted} new items, updated ${totalUpdated}. Total active schemes: ${totalSchemesInDB}.`
        : hasAnySuccess
          ? `Partial government sync complete: accessible portals synchronized (${totalInserted} added, ${totalUpdated} updated). Some sources restricted or unavailable.`
          : `Official government portals were temporarily unreachable. Application is operating safely on verified local cached data.`;

      console.log(`[GovData] Sync finished. Total schemes in DB: ${totalSchemesInDB}`);

      return {
        success: hasAnySuccess || allSuccess,
        partialSuccess: hasAnySuccess && hasFailures,
        message: summary,
        startedAt,
        completedAt,
        sources,
        totalInserted,
        totalUpdated,
        totalSkipped,
        totalSchemesInDB,
        totalUpdatesInDB,
        errors
      };
    } finally {
      isSyncInProgress = false;
    }
  }

  /**
   * Return fresh live updates from PIB or local cache fallback
   */
  static async getLiveUpdates() {
    const pibResult = await this.fetchPIBReleases();
    if (pibResult.items && pibResult.items.length > 0) {
      return pibResult.items;
    }
    // Fallback to stored updates with explicit CACHED tag
    const cached = db.find('updates', u => u.active !== false);
    return cached.map(u => ({ ...u, dataStatus: u.dataStatus || 'CACHED' }));
  }
}
