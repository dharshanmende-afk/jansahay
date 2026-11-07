import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let isPostgresAvailable = false;

export const getPgPool = () => {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning]:', err.message);
    });

    return pool;
  } catch (err) {
    console.warn('[PostgreSQL Initialization Error]:', err.message);
    return null;
  }
};

export const checkPostgresConnectivity = async () => {
  const p = getPgPool();
  if (!p) {
    isPostgresAvailable = false;
    return false;
  }

  try {
    const client = await p.connect();
    await client.query('SELECT 1');
    client.release();
    isPostgresAvailable = true;
    return true;
  } catch (err) {
    isPostgresAvailable = false;
    return false;
  }
};

export const runMigrations = async () => {
  const isUp = await checkPostgresConnectivity();
  if (!isUp) {
    console.log('[PostgreSQL] No live database detected. Migration skipped (operating in fallback JSON mode).');
    return false;
  }

  const p = getPgPool();
  const client = await p.connect();

  try {
    console.log('[PostgreSQL] Running schema migrations...');
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('[PostgreSQL] Migration 001_initial_schema.sql executed successfully.');
      return true;
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL Migration Error]:', err);
    throw err;
  } finally {
    client.release();
  }
  return false;
};

export const query = async (text, params) => {
  const p = getPgPool();
  if (!p) throw new Error('Database pool not initialized');
  return p.query(text, params);
};

export default {
  getPgPool,
  checkPostgresConnectivity,
  runMigrations,
  query,
  get isAvailable() {
    return isPostgresAvailable;
  }
};
