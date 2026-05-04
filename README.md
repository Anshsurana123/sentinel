# <p align="center">🛰️ THE SENTINEL</p>

<p align="center">
  <strong>High-Performance Student Intelligence Aggregator & Academic Lineage Engine</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google-gemini" alt="Gemini" />
  <img src="https://img.shields.io/badge/Cerebras-Hardware_Accel-FF6B6B?style=for-the-badge" alt="Cerebras" />
</p>

---

## 🌌 Overview

**Sentinel** is a state-of-the-art intelligence orchestration system designed to bridge the gap between fragmented student communication and rigorous academic verification. It ingests data from real-time streams (WhatsApp, Discord, Canvas), processes it through a hardware-accelerated semantic core, and provides deep analytical tools for academic lineage and mathematical translation.

![Sentinel Dashboard](file:///C:/Users/ANSH/.gemini/antigravity/brain/93a236b2-8ba5-425c-b61d-bc9e0e181acc/sentinel_dashboard_mockup_1777869199556.png)

---

## 🚀 Key Modules

### 💎 Rosetta Engine: Physics → Calculus
The **Rosetta Engine** is a specialized translation layer that transforms raw physics equations into their underlying calculus representations.
- **Bi-directional Mapping**: Physics form (LaTeX) ↔ Calculus derivative form.
- **Component Analysis**: Automated breakdown of symbols, meanings, and units.
- **Dynamic Simulations**: Integration with `Matter.js` and `Mafs` for real-time physics visualizations (Pendulums, Springs, Projectiles).
- **Graphing Config**: Automated suggestion of optimal graph types (Position-Time, Velocity-Time).

### 📜 Lineage Engine: Academic Truth-Checking
A powerful verification tool that traces claims back to primary source documents using SVG-based node graph visualization.
- **Verdict Classification**: Automatically categorizes claims as *Supports*, *Refutes*, *Unrelated*, or *Answered*.
- **Exact Evidence**: Pinpoints exact sentences and page numbers within source PDFs.
- **Relational Mapping**: Visualize the flow of information from a claim to its academic roots.

### 🛰️ Multi-Channel Ingestion
Sentinel never sleeps. It aggregates intelligence from the platforms students actually use.
- **WhatsApp Sentinel**: Real-time message listener with a high-performance **Anti-Flood Gate** to prevent backlog spikes.
- **Discord Intelligence**: Seamless integration for community-driven data gathering.
- **Canvas Sync**: (WIP) Direct academic record ingestion.
- **SHA-256 Fingerprinting**: Ensures data integrity and prevents duplicate processing.

---

## 🛠️ Technical Architecture

Sentinel is built on a "Hardened Brutalist" stack, prioritizing speed, type safety, and semantic depth.

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15+ (App Router), React 19, Tailwind CSS 4 |
| **Backend** | Node.js Runtime, Prisma 7 ORM |
| **Database** | Supabase (PostgreSQL) + PgBouncer |
| **Intelligence** | Google Gemini 2.5 Flash, Cerebras (Llama-3.1-8b) |
| **Visuals** | SVG Node Graphs, Mafs (Mathematical Functions), Matter-js |
| **Deployment** | Vercel (Frontend), Render (Discord/WhatsApp Listeners) |

---

## 🏗️ Getting Started

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file with the following keys:
   ```env
   DATABASE_URL="postgresql://..."
   GOOGLE_API_KEY="your-gemini-key"
   DISCORD_TOKEN="your-discord-token"
   WHATSAPP_SESSION_ID="..."
   ```

3. **Database Migration**:
   ```bash
   npx prisma db push
   ```

4. **Launch Sentinel**:
   ```bash
   npm run dev
   ```

### Running Autonomous Listeners

To start the real-time ingestion bots:
- **WhatsApp**: `npm run start:whatsapp`
- **Discord**: `npm run start:bot`

---

## 🧪 Maintenance & Health
Run the automated validation suite to ensure the integrity of the database and API connections:
```bash
npx tsx scripts/db-check.ts
```

---

<p align="center">
  Built with 💜 by <a href="https://github.com/Anshsurana123">Ansh Surana</a>
</p>
