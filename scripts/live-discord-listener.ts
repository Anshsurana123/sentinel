import 'dotenv/config';
import http from 'http';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { IngestionEngine } from '../src/lib/sentinel/engine';

/**
 * RENDER HEALTH CHECK SERVER
 * Injected to satisfy Render's requirement for a port binding.
 */
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('🟢 Sentinel Bot is Alive and Listening.');
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
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  try {
    console.log(`[Event] Signal from ${message.author.username}`);
    
    const task = await IngestionEngine.process('DISCORD', {
      id: message.id,
      content: message.content,
      author: { 
        id: message.author.id, 
        username: message.author.username 
      },
      timestamp: message.createdAt.toISOString()
    });

    console.log(`[Success] Ingested: ${task.title}`);
  } catch (error: any) {
    console.error(`[Error] Ingestion failed:`, error.message);
  }
});

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('CRITICAL: DISCORD_TOKEN is missing in .env');
  process.exit(1);
}

client.login(TOKEN);
