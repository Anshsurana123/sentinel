import 'dotenv/config';
import http from 'http';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { IngestionEngine } from '../src/lib/sentinel/engine';
import { SemanticParser } from '../src/lib/sentinel/nlp';
import { prisma } from '../src/lib/prisma';

/**
 * RENDER HEALTH CHECK SERVER
 */
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('🟢 Sentinel Bot is Alive and Listening. Instance: https://sentinel-kuw8.onrender.com');
});

server.listen(PORT, () => {
  console.log(`[Health Check] Internal server listening on port ${PORT}`);
});

/**
 * FAST PATH: Instant keyword matching (zero AI cost)
 */
const DISTRACTION_KEYWORDS = ['valo', 'valorant', 'play', 'game', 'gaming', 'online', 'hop on', 'csgo', 'mc', 'fortnite', 'roblox', 'apex', 'cod', 'league', 'pubg'];

function quickKeywordCheck(text: string): boolean {
  const lower = text.toLowerCase();
  return DISTRACTION_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * DISCORD LISTENER CORE
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`--- The Sentinel: LIVE ---`);
  console.log(`Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const targetChannelId = process.env.DISCORD_CHANNEL_ID;
  if (targetChannelId && message.channel.id !== targetChannelId) return;

  try {
    console.log(`[Event] Signal from ${message.author.username}: "${message.content}"`);

    // ═══════════════════════════════════════════════════════════
    // FOCUS MODE SHIELD (Only runs when Study Mode is ON)
    // ═══════════════════════════════════════════════════════════
    const settings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });

    if (settings?.studyModeActive) {
      
      // LAYER 1: Fast Path — Instant keyword check (0ms, no AI)
      if (quickKeywordCheck(message.content)) {
        await message.reply("Currently in **Sentinel Focus Mode**. Distraction signals are being deflected. 🛡️");
        console.log(`[Deflection:Keyword] Blocked: "${message.content}"`);
        return;
      }

      // LAYER 2: AI Intent Classifier — Catches semantic distractions (e.g., "yo come chill tonight")
      const intent = await SemanticParser.classifyIntent(message.content);
      
      if (intent.distraction) {
        await message.reply(`Currently in **Sentinel Focus Mode**. Distraction signals are being deflected. 🛡️\n-# Reason: ${intent.reason}`);
        console.log(`[Deflection:AI] Blocked: "${message.content}" — Reason: ${intent.reason}`);
        return;
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PIPELINE 2: Task Extraction (runs for all non-distraction msgs)
    // ═══════════════════════════════════════════════════════════
    const task = await IngestionEngine.process('DISCORD', {
      id: message.id,
      content: message.content,
      author: { 
        id: message.author.id, 
        username: message.author.username 
      },
      timestamp: message.createdAt.toISOString()
    });

    if (!task) {
      console.log(`[Filtered] Non-actionable signal discarded.`);
      return;
    }

    console.log(`[Success] Ingested: ${task.title}`);
  } catch (error: any) {
    console.error(`[Error] Ingestion failed:`, error.message);
  }
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error('CRITICAL: DISCORD_BOT_TOKEN is missing');
  process.exit(1);
}

client.login(TOKEN);
