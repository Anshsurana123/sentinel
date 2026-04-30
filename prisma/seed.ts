import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { createHash } from 'crypto';

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DIRECT_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- The Sentinel: Seeding Initial State ---');

  const welcomeContent = 'Welcome to The Sentinel. Your ingestion engine is live and persistent.';
  const fingerprint = createHash('sha256')
    .update(`SYSTEM:welcome:${welcomeContent}`)
    .digest('hex');

  const welcomeTask = await prisma.universalTask.upsert({
    where: { fingerprint },
    update: {},
    create: {
      fingerprint,
      source: 'SYSTEM',
      externalId: 'welcome-001',
      title: 'Welcome to Sentinel',
      content: welcomeContent,
      priority: 'HIGH',
      metadata: {
        version: '1.0.0',
        environment: 'production'
      }
    },
  });

  console.log(`Seed Success: Created task with ID ${welcomeTask.id}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('Seed Failed:', e);
  process.exit(1);
});
