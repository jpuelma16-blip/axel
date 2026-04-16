import { NextRequest } from "next/server";

// Serves TwiML for outbound calls with a custom message.
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${request.headers.get("host")}`;
  const message = request.nextUrl.searchParams.get("message") ?? "Hola, te llama Axel Ruta Express.";

  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX" voice="Polly.Mia">${safe}</Say>
  <Gather input="speech" action="${baseUrl}/api/voice/gather" method="POST"
          language="es-MX" speechTimeout="auto" timeout="5">
    <Say language="es-MX" voice="Polly.Mia">Si tienes alguna pregunta, puedes hablar ahora.</Say>
  </Gather>
  <Say language="es-MX" voice="Polly.Mia">Gracias. ¡Hasta pronto!</Say>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
