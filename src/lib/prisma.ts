import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * Prisma 7 requires a driver adapter. We use @prisma/adapter-pg with node-postgres.
 * - For app routes (Next.js): uses DATABASE_URL (pooled, port 6543)
 * - For scripts/migrations: uses DIRECT_URL (direct, port 5432)
 */
function createPrismaClient(useDirect = false) {
  const connectionString = useDirect
    ? process.env.DIRECT_URL
    : process.env.DATABASE_URL;

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { createPrismaClient };
