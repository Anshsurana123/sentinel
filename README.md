# The Sentinel 🛰️

High-Performance Student Intelligence Aggregator.

## Deployment Status
- **Web UI**: https://sentinel-kuw8.onrender.com (Vercel/Render)
- **Discord Bot**: Active (Render Web Service)
- **NLP Engine**: Cerebras (Llama-3.1-8b)
- **Database**: Supabase (PostgreSQL + PgBouncer)

## Architecture
- **Ingestion**: Multi-strategy (Discord/Canvas) with SHA-256 fingerprinting.
- **Persistence**: Prisma 7 with Split-Cloud connection management.
- **Semantic Core**: Hardware-accelerated LLM extraction.
- **UI**: Brutalist Next.js App Router (Server-side rendered).

## Maintenance
To run local health check:
```bash
npx tsx scripts/db-check.ts
```
