import { NextRequest } from "next/server";
import { getAIResponse, VOICE_SYSTEM_PROMPT } from "@/lib/assistant";
import { getCallHistory, appendToCall, endCall } from "@/lib/call-sessions";

export async function POST(request: NextRequest) {
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${request.headers.get("host")}`;
  const formData = await request.formData();

  const callSid     = (formData.get("CallSid")      as string) ?? "unknown";
  const callStatus  = (formData.get("CallStatus")   as string) ?? "";
  const speechResult = (formData.get("SpeechResult") as string) ?? "";
  const caller      = (formData.get("Caller")        as string) ?? "";

  // Call ended — clean up session
  if (callStatus === "completed" || callStatus === "failed") {
    endCall(callSid);
    return new Response("", { status: 204 });
  }

  let replyText: string;

  if (!speechResult.trim()) {
    replyText = "No escuché tu respuesta. ¿Puedes repetirlo?";
  } else {
    // Load history and append new user message
    const history = getCallHistory(callSid);
    const userMsg = { role: "user" as const, content: speechResult };
    const messages = [...history, userMsg];

    replyText = await getAIResponse(messages, "llamada", VOICE_SYSTEM_PROMPT);

    // Persist full exchange in session
    appendToCall(
      callSid,
      userMsg,
      { role: "assistant", content: replyText }
    );

    console.log(`📞 [${callSid}] [${caller}] "${speechResult}" → "${replyText.slice(0, 80)}…"`);
  }

  // Sanitize for TTS XML
  const safe = replyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/[*_~`#]/g, "");

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX" voice="Polly.Mia">${safe}</Say>
  <Gather input="speech" action="${baseUrl}/api/voice/gather" method="POST"
          language="es-MX" speechTimeout="auto" timeout="8">
    <Say language="es-MX" voice="Polly.Mia">¿En qué más te puedo ayudar?</Say>
  </Gather>
  <Say language="es-MX" voice="Polly.Mia">Gracias por llamar a Axel Ruta Express. ¡Hasta pronto!</Say>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
