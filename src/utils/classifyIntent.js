import { INTENTS } from "../data/intents";

export function classifyIntent(text) {
  const q = text.toLowerCase();
  // Prefer the longest matching keyword so more specific phrases
  // (e.g. "update pan") win over shorter overlapping ones (e.g. "pan").
  let best = null;
  let bestLen = 0;
  for (const intent of INTENTS) {
    for (const k of intent.keywords) {
      if (q.includes(k) && k.length > bestLen) {
        best = intent;
        bestLen = k.length;
      }
    }
  }
  if (best) {
    return { intent: best, confidence: 90 + Math.floor(Math.random() * 8) };
  }
  return { intent: null, confidence: 30 + Math.floor(Math.random() * 20) };
}
