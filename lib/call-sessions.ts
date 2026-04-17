import type Anthropic from "@anthropic-ai/sdk";

// In-memory store por CallSid — válido mientras el proceso esté activo
const sessions = new Map<string, { msgs: Anthropic.MessageParam[]; timer: ReturnType<typeof setTimeout> }>();
const TTL = 35 * 60 * 1000; // 35 min (máx duración de una llamada)

export function getCallHistory(callSid: string): Anthropic.MessageParam[] {
  return sessions.get(callSid)?.msgs ?? [];
}

export function appendToCall(callSid: string, ...newMsgs: Anthropic.MessageParam[]) {
  const existing = sessions.get(callSid);
  if (existing) {
    clearTimeout(existing.timer);
    existing.msgs.push(...newMsgs);
    existing.timer = setTimeout(() => sessions.delete(callSid), TTL);
  } else {
    const timer = setTimeout(() => sessions.delete(callSid), TTL);
    sessions.set(callSid, { msgs: [...newMsgs], timer });
  }
}

export function endCall(callSid: string) {
  const s = sessions.get(callSid);
  if (s) { clearTimeout(s.timer); sessions.delete(callSid); }
}
