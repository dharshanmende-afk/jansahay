// ==============================================================================
// JanSahay AI — Prisma Client Singleton & Health Checker
// ==============================================================================

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

let prismaInstance;

if (process.env.NODE_ENV === 'production') {
  prismaInstance = new PrismaClient({
    log: ['error', 'warn']
  });
} else {
  if (!global.__jansahay_prisma__) {
    global.__jansahay_prisma__ = new PrismaClient({
      log: process.env.DEBUG_PRISMA ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
    });
  }
  prismaInstance = global.__jansahay_prisma__;
}

export const prisma = prismaInstance;

/**
 * Checks whether the PostgreSQL database is reachable via Prisma
 * @returns {Promise<boolean>}
 */
export const checkPrismaConnectivity = async () => {
  if (!process.env.DATABASE_URL) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    return false;
  }
};

export default prisma;
