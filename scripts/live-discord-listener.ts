import 'dotenv/config';
import http from 'http';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { IngestionEngine } from '../src/lib/sentinel/engine';
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
 * Distraction keywords for Focus Mode deflection
 */
const DISTRACTION_KEYWORDS = ['valo', 'play', 'game', 'online', 'hop on', 'csgo', 'mc', 'fortnite', 'roblox', 'apex', 'cod', 'league'];

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

    // ═══════════════════════════════════════════════════
    // STEP 1: FOCUS MODE CHECK (BEFORE AI — fast & free)
    // ═══════════════════════════════════════════════════
    const settings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });
    
    if (settings?.studyModeActive) {
      const contentLower = message.content.toLowerCase();
      const isDistraction = DISTRACTION_KEYWORDS.some(keyword => contentLower.includes(keyword));
      
      if (isDistraction) {
        await message.reply("Currently in **Sentinel Focus Mode**. Distraction signals are being deflected. 🛡️");
        console.log(`[Deflection] Blocked distraction from ${message.author.username}`);
        return; // Exit early — don't waste AI tokens
      }
    }

    // ═══════════════════════════════════════════════════
    // STEP 2: AI INGESTION (only for non-distraction msgs)
    // ═══════════════════════════════════════════════════
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
      console.log(`[Filtered] Signal discarded as noise.`);
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
