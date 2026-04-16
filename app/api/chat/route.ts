import { getAIClient } from "@/lib/assistant";

const SYSTEM_PROMPT = `Eres Axel, el asistente virtual de Axel Ruta Express, un servicio de logística y envíos express en Chile.

Eres amable, profesional y conciso. Habla siempre en español.

SERVICIOS:
- Plan Operativa ($29/mes): hasta 500 envíos/mes, seguimiento en tiempo real, soporte por correo, integración con 1 tienda
- Plan Pro ($79/mes): envíos ilimitados, rutas optimizadas con IA, soporte 24/7, integraciones ilimitadas, API access

CONTACTO:
- Teléfono / WhatsApp: +56 9 2247 4974
- Web: axel-ruta-express.netlify.app

PUEDES AYUDAR CON:
- Información sobre planes y precios
- Estado de envíos (solicita el número de guía de 10 dígitos)
- Agendar recogidas o entregas
- Resolver dudas sobre el servicio
- Conectar con un agente humano si el cliente lo pide

REGLAS:
- Máximo 3 oraciones por respuesta, sé directo
- Si no sabes algo, ofrece conectar con un agente
- Para rastrear un envío pide el número de guía`;

export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const client = getAIClient();

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
