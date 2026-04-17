import { NextRequest } from "next/server";
import { getAIResponse } from "@/lib/assistant";
import type Anthropic from "@anthropic-ai/sdk";

// Historial de SMS por número (en memoria — se limpia al reiniciar)
const smsHistory = new Map<string, Anthropic.MessageParam[]>();

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body   = (formData.get("Body") as string) ?? "";
  const from   = (formData.get("From") as string) ?? "";

  console.log(`SMS de ${from}: ${body}`);

  let replyText: string;

  if (!body.trim()) {
    replyText = "Hola, soy Axel de Ruta Express. ¿En qué puedo ayudarte?";
  } else {
    if (!smsHistory.has(from)) smsHistory.set(from, []);
    const msgs = smsHistory.get(from)!;
    msgs.push({ role: "user", content: body });
    if (msgs.length > 20) msgs.splice(0, msgs.length - 20);

    replyText = await getAIResponse([...msgs], "sms");
    msgs.push({ role: "assistant", content: replyText });
  }

  const safe = replyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<MessagingResponse>
  <Message>${safe}</Message>
</MessagingResponse>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
