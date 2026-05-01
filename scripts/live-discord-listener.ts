import 'dotenv/config';
import http from 'http';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { IngestionEngine } from '../src/lib/sentinel/engine';

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
  console.log(`Listening on Channel ID: ${process.env.DISCORD_CHANNEL_ID || 'ALL_CHANNELS'}`);
});

client.on(Events.MessageCreate, async (message) => {
  // 1. Ignore bots
  if (message.author.bot) return;

  // 2. Filter by Channel ID if provided in env
  const targetChannelId = process.env.DISCORD_CHANNEL_ID;
  if (targetChannelId && message.channel.id !== targetChannelId) return;

  try {
    console.log(`[Event] Signal from ${message.author.username} in ${message.channel.id}`);
    
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

// UPDATED KEY: DISCORD_BOT_TOKEN to match your dashboard
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
  console.error('CRITICAL: DISCORD_BOT_TOKEN is missing in environment variables');
  process.exit(1);
}

client.login(TOKEN);
