import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { initialSeedData } from './seedData.js';
import { normalizeSchemeRecord, loadExternalStateSchemes } from '../data/stateExpansionLoader.js';
import pgClient, { checkPostgresConnectivity, runMigrations } from './pgClient.js';
import { prisma, checkPrismaConnectivity } from './prismaClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'jansahay-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.data = {
      users: [],
      profiles: [],
      schemes: [],
      scheme_rules: [],
      documentGuides: [],
      userDocuments: [],
      updates: [],
      recommendations: [],
      chat_logs: [],
      feedback: [],
      unansweredAiQueries: [],
      languageMetrics: { en: 0, hi: 0, mr: 0 }
    };
    this.postgresConnected = false;
    this.prisma = prisma;
    this.init();
  }

  async isPrismaConnected() {
    return await checkPrismaConnectivity();
  }

  init() {
    // 1. Load / initialize data store synchronously first so callers never race during startup
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };

        // If schemes or documentGuides are empty, reseed
        if (!this.data.schemes || this.data.schemes.length === 0 || !this.data.documentGuides || this.data.documentGuides.length === 0) {
          console.log('[DB] Reseeding missing collections with verified datasets...');
          this.seedInitial();
        } else {
          // Normalize canonical structured scheme metadata and merge any data-only state files
          this.data.schemes = this.data.schemes.map(normalizeSchemeRecord);
          const externalSchemes = loadExternalStateSchemes();
          for (const ext of externalSchemes) {
            const exists = this.data.schemes.some(s => String(s.name).toLowerCase() === String(ext.name).toLowerCase());
            if (!exists) {
              const nextId = Math.max(0, ...this.data.schemes.map(s => Number(s.id) || 0)) + 1;
              this.data.schemes.push({ ...ext, id: ext.id || nextId });
            }
          }
          console.log(`[DB] Loaded existing database: ${this.data.schemes.length} schemes, ${this.data.documentGuides.length} document guides.`);
        }
      } else {
        console.log('[DB] Initializing new database with comprehensive seed dataset...');
        this.seedInitial();
      }
    } catch (err) {
      console.error('[DB] Error loading database, initializing fresh seed:', err);
      this.seedInitial();
    }

    // 2. Check PostgreSQL connectivity asynchronously
    checkPostgresConnectivity()
      .then(connected => {
        this.postgresConnected = connected;
        if (connected) {
          console.log('🐘 [DB] Connected to PostgreSQL. Migrations and relational tables active.');
          return runMigrations().catch(err => console.warn('[DB] Migration note:', err.message));
        } else {
          console.log('📂 [DB] PostgreSQL not configured or offline. Running on high-performance local database.');
        }
      })
      .catch(() => {
        this.postgresConnected = false;
      });
  }

  seedInitial() {
    const isProduction = process.env.NODE_ENV === 'production';

    // In production mode, disable demo accounts entirely
    let users = [];
    if (!isProduction) {
      const demoRoles = [
        { id: 1, name: 'Government Administrator', email: 'admin@jansahay.gov.in', role: 'ADMIN' },
        { id: 2, name: 'Rahul Patil', email: 'student@jansahay.ai', role: 'CITIZEN' },
        { id: 3, name: 'Ramesh Shinde', email: 'farmer@jansahay.ai', role: 'CITIZEN' },
        { id: 4, name: 'Priya Deshmukh', email: 'business@jansahay.ai', role: 'CITIZEN' }
      ];
      console.log('------------------------------------------------------------------');
      console.log('🔑 [DEV SEED] Generated Random Demo Credentials (NODE_ENV=development):');
      for (const u of demoRoles) {
        const randomPass = `Jan_${crypto.randomBytes(6).toString('hex')}`;
        const passwordHash = bcrypt.hashSync(randomPass, 10);
        users.push({
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          createdAt: new Date().toISOString()
        });
        console.log(`   • [${u.role.padEnd(7)}] ${u.email.padEnd(25)} -> Password: ${randomPass}`);
      }
      console.log('   ⚠️  Zero demo accounts are created in production mode.');
      console.log('------------------------------------------------------------------');
    } else {
      console.log('🔒 [PROD SEED] Production mode active: Zero demo accounts seeded.');
    }

    this.data = {
      users,
      profiles: !isProduction ? (initialSeedData.profiles || []) : [],
      schemes: [
        ...(initialSeedData.schemes || []).map(normalizeSchemeRecord),
        ...loadExternalStateSchemes()
      ],
      scheme_rules: [],
      documentGuides: initialSeedData.documentGuides || [],
      userDocuments: !isProduction ? (initialSeedData.userDocuments || []) : [],
      updates: initialSeedData.updates || [],
      recommendations: [],
      chat_logs: [],
      feedback: [],
      unansweredAiQueries: [],
      languageMetrics: { en: 0, hi: 0, mr: 0 }
    };
    this.save();
    console.log(`[DB] Seeded: ${this.data.users.length} users, ${this.data.schemes.length} schemes, ${this.data.documentGuides.length} guides.`);
  }

  save() {
    try {
      // Atomic write: write to a temporary file then rename to reduce corruption risk
      const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Save error:', err);
      // Fallback direct write if rename fails across partitions
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (fallbackErr) {
        console.error('[DB] Critical save error:', fallbackErr);
      }
    }
  }

  backup() {
    try {
      const backupDir = path.join(DATA_DIR, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `jansahay-db-${timestamp}.json`);
      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, backupPath);
        return backupPath;
      }
    } catch (err) {
      console.warn('[DB] Backup creation failed:', err.message);
    }
    return null;
  }

  // --- Generic Helpers ---
  getCollection(name) {
    if (!this.data[name]) this.data[name] = [];
    return this.data[name];
  }

  findById(collectionName, id) {
    const col = this.getCollection(collectionName);
    return col.find(item => String(item.id) === String(id)) || null;
  }

  find(collectionName, predicate = () => true) {
    const col = this.getCollection(collectionName);
    return col.filter(predicate);
  }

  findOne(collectionName, predicate) {
    const col = this.getCollection(collectionName);
    return col.find(predicate) || null;
  }

  insert(collectionName, item) {
    const col = this.getCollection(collectionName);
    const newId = item.id || (col.length > 0 ? Math.max(...col.map(i => Number(i.id) || 0)) + 1 : 1);
    const doc = {
      ...item,
      id: newId,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    col.push(doc);
    this.save();
    return doc;
  }

  update(collectionName, id, updates) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;
    col[index] = {
      ...col[index],
      ...updates,
      id: col[index].id, // preserve id
      updatedAt: new Date().toISOString()
    };
    this.save();
    return col[index];
  }

  recordLanguageUsage(lang) {
    const code = String(lang || 'en').toLowerCase().slice(0, 2);
    const normalized = ['en', 'hi', 'mr'].includes(code) ? code : 'en';
    if (!this.data.languageMetrics || typeof this.data.languageMetrics !== 'object') {
      this.data.languageMetrics = { en: 0, hi: 0, mr: 0 };
    }
    this.data.languageMetrics[normalized] = (this.data.languageMetrics[normalized] || 0) + 1;
    this.save();
    return this.data.languageMetrics;
  }

  delete(collectionName, id) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => String(item.id) === String(id));
    if (index === -1) return false;
    col.splice(index, 1);
    this.save();
    return true;
  }
}

export const db = new Database();
export default db;
