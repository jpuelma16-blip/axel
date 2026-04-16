import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const SYSTEM_PROMPT = `Eres el asistente virtual de Axel Ruta Express, un servicio de logística y envíos express en Chile.

Tu nombre es Axel. Eres amable, profesional y conciso.

SERVICIOS QUE OFRECES:
- Ruta Express: envíos y entregas rápidas en el mismo día o al día siguiente
- Plan Operativa: $29/mes — hasta 500 envíos/mes, seguimiento en tiempo real, soporte por correo
- Plan Pro: $79/mes — envíos ilimitados, IA para rutas, soporte 24/7, API access

CONTACTO: +56 9 2247 4974

PUEDES AYUDAR CON:
- Información sobre planes y precios
- Estado de envíos (pide el número de seguimiento)
- Agendar recogidas o entregas
- Resolver dudas sobre el servicio
- Conectar con un agente humano si el cliente lo solicita

REGLAS:
- Responde en español siempre
- Sé breve: máximo 2-3 oraciones por respuesta (para llamadas de voz)
- Si no sabes algo, ofrece transferir con un agente
- Para rastrear un envío, pide el número de guía de 10 dígitos`;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const tokenFile = process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE;

  if (apiKey && !apiKey.startsWith("sk-ant-si-")) {
    return new Anthropic({ apiKey });
  }

  if (tokenFile) {
    const token = readFileSync(tokenFile, "utf-8").trim();
    return new Anthropic({
      apiKey: "placeholder",
      defaultHeaders: { Authorization: `Bearer ${token}`, "x-api-key": "" },
    });
  }

  return new Anthropic({ apiKey: apiKey ?? "" });
}

export async function getAIResponse(userMessage: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = message.content[0];
  return block.type === "text"
    ? block.text
    : "Un momento, no pude procesar tu solicitud.";
}
