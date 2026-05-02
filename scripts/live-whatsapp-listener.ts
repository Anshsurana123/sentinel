import 'dotenv/config';
import http from 'http';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { IngestionEngine } from '../src/lib/sentinel/engine';
import { SemanticParser } from '../src/lib/sentinel/nlp';
import { prisma } from '../src/lib/prisma';
import { generateDailyBriefing } from '../src/lib/sentinel/briefing';
import { subHours } from 'date-fns';

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
 * Distraction keywords for Focus Mode
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
// QR CODE → DATABASE BRIDGE (replaces terminal QR)
// ═══════════════════════════════════════════════════
client.on('qr', async (qr: string) => {
  console.log('[Auth] New QR code generated. Writing to database for UI pickup...');
  
  await prisma.systemState.upsert({
    where: { id: 'global' },
    update: { whatsappQr: qr, whatsappConnected: false },
    create: { id: 'global', whatsappQr: qr, whatsappConnected: false },
  });

  console.log('[Auth] QR written to SystemState. Waiting for scan...');
});

client.on('authenticated', () => {
  console.log('[Auth] WhatsApp authentication successful.');
});

client.on('auth_failure', async (msg: string) => {
  console.error('[Auth] CRITICAL: WhatsApp authentication failed:', msg);
  
  await prisma.systemState.upsert({
    where: { id: 'global' },
    update: { whatsappQr: null, whatsappConnected: false },
    create: { id: 'global', whatsappQr: null, whatsappConnected: false },
  });
});

client.on('ready', async () => {
  console.log('🟢 Sentinel Secondary Core Online: WhatsApp Linked.');
  
  // Clear QR and mark as connected
  const state = await prisma.systemState.upsert({
    where: { id: 'global' },
    update: { whatsappQr: null, whatsappConnected: true },
    create: { id: 'global', whatsappQr: null, whatsappConnected: true },
  });

  // ═══════════════════════════════════════════════════
  // MORNING BRIEFING (Startup Catch-up)
  // ═══════════════════════════════════════════════════
  const cooldownPeriod = subHours(new Date(), 12);
  
  if (!state.lastBriefingAt || state.lastBriefingAt < cooldownPeriod) {
    console.log('[Briefing] Cooldown expired. Generating tactical briefing...');
    
    const briefingText = await generateDailyBriefing();
    const targetNumber = process.env.MY_PERSONAL_NUMBER;

    if (briefingText && targetNumber) {
      try {
        // Ensure the number is formatted correctly for whatsapp-web.js (usually @c.us)
        const chatID = targetNumber.includes('@c.us') ? targetNumber : `${targetNumber}@c.us`;
        await client.sendMessage(chatID, `*OFFICIAL SENTINEL BRIEFING*\n\n${briefingText}`);
        
        // Update cooldown timestamp
        await prisma.systemState.update({
          where: { id: 'global' },
          data: { lastBriefingAt: new Date() }
        });
        
        console.log('[Briefing] Success: Tactical briefing transmitted.');
      } catch (err: any) {
        console.error('[Briefing] Transmission failed:', err.message);
      }
    } else {
      console.log('[Briefing] No actionable signals or missing personal number. Skipping transmission.');
    }
  } else {
    console.log('[Briefing] Standing down: Cooldown active.');
  }
});

client.on('disconnected', async (reason: string) => {
  console.log('[Auth] WhatsApp disconnected:', reason);
  
  await prisma.systemState.upsert({
    where: { id: 'global' },
    update: { whatsappQr: null, whatsappConnected: false },
    create: { id: 'global', whatsappQr: null, whatsappConnected: false },
  });
});

// ═══════════════════════════════════════════════════
// MESSAGE INGESTION
// ═══════════════════════════════════════════════════
client.on('message', async (message) => {
  if (message.isStatus) return;
  if (!message.body || message.body.trim().length === 0) return;

  // ═══ FLOOD GATE: Only process live messages (within 60s) ═══
  const now = Math.floor(Date.now() / 1000);
  if ((now - message.timestamp) > 60) {
    console.log(`[Flood Gate] Ignoring old message from ${message.from} (${now - message.timestamp}s old)`);
    return;
  }

  try {
    const contact = await message.getContact();
    const authorName = contact.pushname || contact.name || message.from;

    console.log(`[WA Event] Signal from ${authorName}: "${message.body}"`);

    // FOCUS MODE SHIELD
    const settings = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });

    if (settings?.studyModeActive) {
      if (quickKeywordCheck(message.body)) {
        await message.reply("Currently in *Sentinel Focus Mode*. Distraction signals are being deflected. 🛡️");
        console.log(`[WA Deflection:Keyword] Blocked: "${message.body}"`);
        return;
      }

      const intent = await SemanticParser.classifyIntent(message.body);
      if (intent.distraction) {
        await message.reply(`Currently in *Sentinel Focus Mode*. Distraction signals are being deflected. 🛡️\n_Reason: ${intent.reason}_`);
        console.log(`[WA Deflection:AI] Blocked: "${message.body}" — ${intent.reason}`);
        return;
      }
    }

    // TASK EXTRACTION
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
