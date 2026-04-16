import { NextRequest } from "next/server";

// Twilio calls this webhook when someone calls the Ruta Express phone number.
// We greet the caller and open a speech-capture loop.
export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${request.headers.get("host")}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${baseUrl}/api/voice/gather" method="POST"
          language="es-MX" speechTimeout="auto" timeout="5">
    <Say language="es-MX" voice="Polly.Mia">
      Hola, bienvenido a Axel Ruta Express. Soy tu asistente virtual.
      ¿En qué puedo ayudarte hoy?
    </Say>
  </Gather>
  <Say language="es-MX" voice="Polly.Mia">
    No recibí tu respuesta. Por favor llama de nuevo. ¡Hasta pronto!
  </Say>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
