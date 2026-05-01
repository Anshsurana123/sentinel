import 'dotenv/config';
import http from 'http';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { IngestionEngine } from '../src/lib/sentinel/engine';
import { SemanticParser } from '../src/lib/sentinel/nlp';
import { prisma } from '../src/lib/prisma';

/**
 * RENDER HEALTH CHECK SERVER (WhatsApp Instance)
 */
const PORT = process.env.PORT || 10001;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('🟢 Sentinel WhatsApp Core is Alive.');
});

server.listen(PORT, () => {
  console.log(`[Health Check] WhatsApp listener on port ${PORT}`);
});

/**
 * Distraction keywords for Focus Mode (shared logic)
 */
const DISTRACTION_KEYWORDS = ['valo', 'valorant', 'play', 'game', 'gaming', 'online', 'hop on', 'csgo', 'mc', 'fortnite', 'roblox', 'apex', 'cod', 'league', 'pubg'];

function quickKeywordCheck(text: string): boolean {
  const lower = text.toLowerCase();
  return DISTRACTION_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * WHATSAPP CLIENT CORE
 */
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// ═══════════════════════════════════════════════════
// AUTHENTICATION: QR Code Pairing
// ═══════════════════════════════════════════════════
client.on('qr', (qr: string) => {
  console.log('\n[Auth] Scan this QR code with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('[Auth] WhatsApp authentication successful.');
});

client.on('auth_failure', (msg: string) => {
  console.error('[Auth] CRITICAL: WhatsApp authentication failed:', msg);
});

client.on('ready', () => {
  console.log('🟢 Sentinel Secondary Core Online: WhatsApp Linked.');
});

// ═══════════════════════════════════════════════════
// MESSAGE INGESTION
// ═══════════════════════════════════════════════════
client.on('message', async (message) => {
  // Skip status updates (stories, broadcasts)
  if (message.isStatus) return;

  // Skip empty messages (media-only, stickers, etc.)
  if (!message.body || message.body.trim().length === 0) return;

  try {
    const contact = await message.getContact();
    const authorName = contact.pushname || contact.name || message.from;

    console.log(`[WA Event] Signal from ${authorName}: "${message.body}"`);

    // ═══════════════════════════════════════════════
    // FOCUS MODE SHIELD
    // ═══════════════════════════════════════════════
    const settings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });

    if (settings?.studyModeActive) {
      // LAYER 1: Fast keyword check
      if (quickKeywordCheck(message.body)) {
        await message.reply("Currently in *Sentinel Focus Mode*. Distraction signals are being deflected. 🛡️");
        console.log(`[WA Deflection:Keyword] Blocked: "${message.body}"`);
        return;
      }

      // LAYER 2: AI Intent Classification
      const intent = await SemanticParser.classifyIntent(message.body);
      if (intent.distraction) {
        await message.reply(`Currently in *Sentinel Focus Mode*. Distraction signals are being deflected. 🛡️\n_Reason: ${intent.reason}_`);
        console.log(`[WA Deflection:AI] Blocked: "${message.body}" — ${intent.reason}`);
        return;
      }
    }

    // ═══════════════════════════════════════════════
    // PIPELINE 2: Task Extraction
    // ═══════════════════════════════════════════════
    const task = await IngestionEngine.process('WHATSAPP', {
      id: message.id.id,
      content: message.body,
      author: authorName,
      timestamp: new Date(message.timestamp * 1000).toISOString(),
    });

    if (!task) {
      console.log(`[WA Filtered] Non-actionable signal discarded.`);
      return;
    }

    console.log(`[WA Success] Ingested: ${task.title}`);
  } catch (error: any) {
    console.error(`[WA Error] Ingestion failed:`, error.message);
  }
});

// ═══════════════════════════════════════════════════
// LAUNCH
// ═══════════════════════════════════════════════════
console.log('[Init] Starting WhatsApp client...');
client.initialize();
