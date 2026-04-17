import { NextRequest } from "next/server";
import { getAIResponse } from "@/lib/assistant";

// Twilio calls this webhook when someone texts the Ruta Express number.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body = (formData.get("Body") as string) ?? "";
  const from = (formData.get("From") as string) ?? "";

  console.log(`SMS de ${from}: ${body}`);

  const replyText = body.trim()
    ? await getAIResponse([{ role: "user", content: body }], "sms")
    : "Hola, soy el asistente de Axel Ruta Express. ¿En qué puedo ayudarte?";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<MessagingResponse>
  <Message>${replyText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
</MessagingResponse>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
