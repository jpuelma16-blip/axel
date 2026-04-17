import { NextRequest } from "next/server";
import { getAIResponse } from "@/lib/assistant";

// Called after Twilio captures speech. We send it to Claude and speak back the reply.
export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${request.headers.get("host")}`;
  const formData = await request.formData();
  const speechResult = (formData.get("SpeechResult") as string) ?? "";

  let replyText: string;
  if (!speechResult.trim()) {
    replyText = "No escuché nada. ¿Puedes repetir tu consulta?";
  } else {
    replyText = await getAIResponse([{ role: "user", content: speechResult }], "llamada");
  }

  // Escape XML special chars
  const safe = replyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX" voice="Polly.Mia">${safe}</Say>
  <Gather input="speech" action="${baseUrl}/api/voice/gather" method="POST"
          language="es-MX" speechTimeout="auto" timeout="5">
    <Say language="es-MX" voice="Polly.Mia">¿Hay algo más en lo que pueda ayudarte?</Say>
  </Gather>
  <Say language="es-MX" voice="Polly.Mia">Gracias por contactar Axel Ruta Express. ¡Hasta pronto!</Say>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
