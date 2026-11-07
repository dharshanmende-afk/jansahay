import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialSeedData } from './seedData.js';

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
      documentGuides: [],
      userDocuments: [],
      updates: [],
      recommendations: []
    };
    this.init();
  }

  init() {
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
  }

  seedInitial() {
    this.data = {
      users: initialSeedData.users || [],
      profiles: initialSeedData.profiles || [],
      schemes: initialSeedData.schemes || [],
      documentGuides: initialSeedData.documentGuides || [],
      userDocuments: initialSeedData.userDocuments || [],
      updates: initialSeedData.updates || [],
      recommendations: []
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
