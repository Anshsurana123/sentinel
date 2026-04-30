import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DIRECT_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const startTime = Date.now();

  try {
    console.log('--- The Sentinel: Schema Verification Audit ---');
    
    // 1. Connection Check
    const result: any[] = await prisma.$queryRaw`SELECT NOW() as current_time`;
    const latency = Date.now() - startTime;
    console.log('Connection Status: LIVE');
    console.log(`Server Time: ${result[0].current_time}`);
    console.log(`Latency: ${latency}ms`);

    // 2. Table Verification
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'UniversalTask'
    `;

    if (tables.length > 0) {
      console.log('Schema Verification: SUCCESS');
      console.log('Table [UniversalTask] is confirmed in Supabase.');
      
      const count = await prisma.universalTask.count();
      console.log(`Current Task Count: ${count}`);
    } else {
      console.warn('Schema Verification: FAILED');
      console.warn('Table [UniversalTask] not found.');
    }

  } catch (error) {
    console.error('Audit Status: CRITICAL FAILURE');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
