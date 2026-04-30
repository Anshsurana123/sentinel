console.log("=> SCRIPT INITIATED <=");

import 'dotenv/config';
import { IngestionEngine } from '../src/lib/sentinel/engine';

const scenarios = [
  {
    name: 'Scenario A (Direct Task)',
    payload: {
      id: `msg_${Date.now()}_A`,
      content: 'Lab report 3 for CS is due tomorrow midnight! <@&123456>',
      author: { username: 'StressStudent', id: "123" },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Scenario B (Vague Stress)',
    payload: {
      id: `msg_${Date.now()}_B`,
      content: "I have so much work for Chem I'm never gonna finish this by Sunday.",
      author: { username: 'PanicMode', id: "456" },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Scenario C (Noise)',
    payload: {
      id: `msg_${Date.now()}_C`,
      content: 'Lol anyone wanna play Valorant?',
      author: { username: 'GamerStudent', id: "789" },
      timestamp: new Date().toISOString()
    }
  }
];

async function runTest() {
  console.log('--- The Sentinel: Shadow Mode Simulation ---');
  
  for (const scene of scenarios) {
    console.log(`\n=> Processing: ${scene.name}`);
    try {
      const task = await IngestionEngine.process('DISCORD', scene.payload);
      console.log(`[SUCCESS] Result: [${task.priority}] ${task.title}`);
      console.log(`Confidence: ${(task.metadata as any).confidence}`);
      console.log(`Fingerprint: ${task.fingerprint}`);
    } catch (e: any) {
      console.error(`[FAILURE] ${scene.name}:`, e.message);
    }
  }
}

// Fixed Async Wrapper to prevent silent exits
runTest()
  .then(() => console.log('\n=> SCRIPT FINISHED <='))
  .catch(err => {
    console.error('FATAL TOP-LEVEL ERROR:', err);
    process.exit(1);
  });