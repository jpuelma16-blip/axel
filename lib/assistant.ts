import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { getAvailableSlots, createBooking, PAQUETES } from "./db";

export function getAIClient(): Anthropic {
  const apiKey    = process.env.ANTHROPIC_API_KEY;
  const bearerToken = process.env.ANTHROPIC_BEARER_TOKEN;
  const tokenFile = process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE;

  if (apiKey && !apiKey.startsWith("sk-ant-si-")) {
    return new Anthropic({ apiKey });
  }
  if (bearerToken) {
    return new Anthropic({
      apiKey: "placeholder",
      defaultHeaders: { Authorization: `Bearer ${bearerToken}`, "x-api-key": "" },
    });
  }
  if (tokenFile && existsSync(tokenFile)) {
    const token = readFileSync(tokenFile, "utf-8").trim();
    return new Anthropic({
      apiKey: "placeholder",
      defaultHeaders: { Authorization: `Bearer ${token}`, "x-api-key": "" },
    });
  }
  return new Anthropic({ apiKey: apiKey ?? "" });
}

// ── Calendar tools definitions ────────────────────────────────────────────
export const CALENDAR_TOOLS: Anthropic.Tool[] = [
  {
    name: "consultar_disponibilidad",
    description: "Consulta los horarios disponibles para agendar un servicio en una fecha específica o los próximos 14 días hábiles.",
    input_schema: {
      type: "object",
      properties: {
        fecha: {
          type: "string",
          description: "Fecha en formato YYYY-MM-DD. Si no se provee, devuelve los próximos 14 días.",
        },
      },
      required: [],
    },
  },
  {
    name: "crear_reserva",
    description: "Crea una reserva de servicio de envío/retiro. Úsala solo cuando el cliente haya confirmado todos los datos.",
    input_schema: {
      type: "object",
      properties: {
        nombre:      { type: "string", description: "Nombre completo del cliente o empresa" },
        contacto:    { type: "string", description: "Número de WhatsApp o teléfono de contacto" },
        fecha:       { type: "string", description: "Fecha del servicio en formato YYYY-MM-DD" },
        hora:        { type: "string", description: "Hora del servicio en formato HH:MM (ej: 09:00)" },
        paquete:     { type: "string", enum: ["basico", "estandar", "grande", "empresarial"], description: "Tipo de paquete" },
        descripcion: { type: "string", description: "Descripción de lo que se va a transportar" },
        origen:      { type: "string", description: "Dirección de origen/retiro" },
        destino:     { type: "string", description: "Dirección de destino/entrega" },
        canal:       { type: "string", description: "Canal de contacto: web, whatsapp, llamada" },
      },
      required: ["nombre", "contacto", "fecha", "hora", "paquete"],
    },
  },
  {
    name: "consultar_paquetes",
    description: "Devuelve los paquetes disponibles con precios y descripciones.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────
export function executeTool(name: string, input: Record<string, any>): string {
  if (name === "consultar_paquetes") {
    return JSON.stringify(
      PAQUETES.map((p) => ({
        ...p,
        precio: p.precio === 0 ? "A coordinar" : `$${p.precio.toLocaleString("es-CL")} CLP`,
      }))
    );
  }

  if (name === "consultar_disponibilidad") {
    if (input.fecha) {
      const slots = getAvailableSlots(input.fecha);
      return JSON.stringify({
        fecha: input.fecha,
        horarios_disponibles: slots,
        disponible: slots.length > 0,
      });
    }
    // Next 14 weekdays
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue;
      const iso = d.toISOString().split("T")[0];
      const slots = getAvailableSlots(iso);
      if (slots.length > 0) days.push({ fecha: iso, horarios: slots });
    }
    return JSON.stringify({ proximos_dias_disponibles: days });
  }

  if (name === "crear_reserva") {
    const pkg = PAQUETES.find((p) => p.id === input.paquete);
    if (!pkg) return JSON.stringify({ error: "Paquete inválido" });
    const slots = getAvailableSlots(input.fecha);
    if (!slots.includes(input.hora)) {
      return JSON.stringify({
        error: `Horario ${input.hora} no disponible. Disponibles: ${slots.join(", ") || "ninguno"}`,
      });
    }
    const id = createBooking({ ...(input as Parameters<typeof createBooking>[0]), precio: pkg.precio });
    return JSON.stringify({
      exito: true,
      id,
      confirmacion: `Reserva #${id} creada para ${input.nombre} el ${input.fecha} a las ${input.hora}. Paquete: ${pkg.nombre}. Precio: ${pkg.precio === 0 ? "a coordinar" : `$${pkg.precio.toLocaleString("es-CL")} CLP`}.`,
    });
  }

  return JSON.stringify({ error: "Herramienta desconocida" });
}

// ── System prompt ─────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const SYSTEM_PROMPT = `Eres Axel, el asistente virtual de Axel Ruta Express, servicio de logística y envíos express en Chile.
Eres amable, cercano y profesional. Adapta tu tono al cliente: más formal con empresas, más directo y cálido con personas. Habla siempre en español.

SERVICIOS Y PAQUETES:
- Paquete Básico: hasta 5 kg — $5.000 CLP — documentos, ropa, artículos pequeños (2-4 hrs)
- Paquete Estándar: 5–20 kg — $8.000 CLP — cajas medianas, electrodomésticos pequeños (3-5 hrs)
- Paquete Grande: 20–50 kg — $12.000 CLP — muebles pequeños, mudanzas parciales (4-6 hrs)
- Paquete Empresarial: +50 kg o alto volumen — precio a coordinar (horario flexible)

HORARIO DE ATENCIÓN: Lunes a viernes, 09:00 a 17:00
CONTACTO: +56 9 2247 4974
FORMULARIO DE RESERVA: ${BASE_URL}/reservar

PARA AGENDAR UN SERVICIO (dos opciones):
  OPCIÓN A — Formulario directo (recomendada):
    → Comparte el link: ${BASE_URL}/reservar
    → El cliente rellena sus datos en pocos pasos y queda agendado automáticamente.

  OPCIÓN B — Por chat (si el cliente prefiere no usar el formulario):
    1. Pregunta qué necesita transportar (para sugerir el paquete adecuado)
    2. Consulta disponibilidad con consultar_disponibilidad
    3. Recoge: nombre, teléfono, fecha, hora, origen, destino, descripción
    4. Confirma todos los datos ANTES de crear la reserva
    5. Crea la reserva y entrega el número de confirmación

PERSONALIZACIÓN:
- Si el cliente da su nombre, úsalo en las respuestas
- Si pide consejo sobre el paquete, haz una recomendación concreta según lo que va a enviar
- Si hay urgencia, destaca la velocidad del servicio
- Para empresas, menciona el Paquete Empresarial con precio a coordinar

REGLAS:
- Máximo 3 oraciones por respuesta, sé directo y útil
- Si no puedes ayudar con algo, ofrece conectar con el equipo humano
- Hoy es ${new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;

// ── Voice system prompt (optimizado para TTS — sin markdown ni URLs) ────────
export const VOICE_SYSTEM_PROMPT = `Eres Axel, el asistente virtual de Axel Ruta Express, servicio de envíos express en Chile.
Hablas por teléfono: usa frases cortas y naturales, sin símbolos, sin listas, sin emojis.
Di los números como palabras cuando sea posible. Sé amable y claro.

PAQUETES DISPONIBLES:
- Paquete Básico: hasta 5 kilos, 5 mil pesos, entrega en 2 a 4 horas
- Paquete Estándar: 5 a 20 kilos, 8 mil pesos, entrega en 3 a 5 horas
- Paquete Grande: 20 a 50 kilos, 12 mil pesos, entrega en 4 a 6 horas
- Paquete Empresarial: más de 50 kilos, precio a coordinar

HORARIO: Lunes a viernes, de 9 a 17 horas.
CONTACTO: más 56 9 2247 4974

PARA AGENDAR:
1. Pregunta qué necesita enviar para sugerir el paquete correcto
2. Consulta disponibilidad con la herramienta consultar_disponibilidad
3. Recoge nombre, teléfono, fecha, hora, dirección de retiro y entrega
4. Confirma los datos en voz con el cliente
5. Crea la reserva y lee el número de confirmación en voz

REGLAS:
- Máximo 2 oraciones por respuesta
- Si el cliente quiere el formulario web, dile que puede escribir al WhatsApp y se lo envían
- Si no sabes algo, ofrece transferir con el equipo humano
- Hoy es ${new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;

// ── Main AI response with tool use ─────────────────────────────────────────
export async function getAIResponse(
  messages: Anthropic.MessageParam[],
  canal = "web",
  systemPromptOverride?: string
): Promise<string> {
  const client = getAIClient();
  const system = systemPromptOverride ?? SYSTEM_PROMPT;

  let response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system,
    tools: CALENDAR_TOOLS,
    messages,
  });

  // Agentic loop: process tool calls
  while (response.stop_reason === "tool_use") {
    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((t) => ({
      type: "tool_result",
      tool_use_id: t.id,
      content: executeTool(t.name, t.input as Record<string, any>),
    }));

    messages = [
      ...messages,
      { role: "assistant", content: response.content },
      { role: "user", content: toolResults },
    ];

    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system,
      tools: CALENDAR_TOOLS,
      messages,
    });
  }

  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return text?.text ?? "No pude generar una respuesta. Intenta de nuevo.";
}
