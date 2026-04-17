import { NextRequest } from "next/server";

// Twilio llama este webhook cuando alguien llama al número de Ruta Express.
// Saluda y abre el loop de captura de voz. Twilio enviará CallSid automáticamente al gather.
export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${request.headers.get("host")}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${baseUrl}/api/voice/gather" method="POST"
          language="es-MX" speechTimeout="auto" timeout="8">
    <Say language="es-MX" voice="Polly.Mia">
      Hola, bienvenido a Axel Ruta Express. Soy Axel, tu asistente virtual.
      Puedo ayudarte con información de nuestros servicios, precios y agendar un retiro o entrega.
      ¿En qué puedo ayudarte hoy?
    </Say>
  </Gather>
  <Say language="es-MX" voice="Polly.Mia">
    No recibí tu respuesta. Por favor vuelve a llamar. ¡Hasta pronto!
  </Say>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
