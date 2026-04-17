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
    const id = createBooking({ ...input, precio: pkg.precio });
    return JSON.stringify({
      exito: true,
      id,
      confirmacion: `Reserva #${id} creada para ${input.nombre} el ${input.fecha} a las ${input.hora}. Paquete: ${pkg.nombre}. Precio: ${pkg.precio === 0 ? "a coordinar" : `$${pkg.precio.toLocaleString("es-CL")} CLP`}.`,
    });
  }

  return JSON.stringify({ error: "Herramienta desconocida" });
}

// ── System prompt ─────────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `Eres Axel, el asistente virtual de Axel Ruta Express, servicio de logística y envíos express en Chile.
Eres amable, profesional y conciso. Habla siempre en español.

SERVICIOS Y PAQUETES:
- Paquete Básico: hasta 5 kg — $5.000 CLP — documentos, ropa, artículos pequeños
- Paquete Estándar: 5–20 kg — $8.000 CLP — cajas medianas, electrodomésticos pequeños
- Paquete Grande: 20–50 kg — $12.000 CLP — muebles pequeños, mudanzas parciales
- Paquete Empresarial: +50 kg o alto volumen — precio a coordinar

HORARIO DE ATENCIÓN: Lunes a viernes, 09:00 a 17:00

CONTACTO: +56 9 2247 4974

PARA AGENDAR UN SERVICIO:
1. Pregunta qué necesita transportar (para sugerir el paquete adecuado)
2. Consulta disponibilidad con la herramienta consultar_disponibilidad
3. Recoge: nombre, teléfono, fecha, hora, origen, destino, descripción
4. Confirma todos los datos con el cliente ANTES de crear la reserva
5. Crea la reserva con crear_reserva y entrega el número de confirmación

REGLAS:
- Máximo 3 oraciones por respuesta, sé directo
- Si no sabes algo, ofrece conectar con un agente humano
- Hoy es ${new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;

// ── Main AI response with tool use ─────────────────────────────────────────
export async function getAIResponse(
  messages: Anthropic.MessageParam[],
  canal = "web"
): Promise<string> {
  const client = getAIClient();

  let response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
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
      system: SYSTEM_PROMPT,
      tools: CALENDAR_TOOLS,
      messages,
    });
  }

  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return text?.text ?? "No pude generar una respuesta. Intenta de nuevo.";
}
