/**
 * Axel – Ruta Express · Bot WhatsApp
 *
 * Arranca con: npm run bot
 * Primera vez: escanea el QR con el teléfono +56 9 2247 4974
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} from "@whiskeysockets/baileys";
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import qrcode from "qrcode-terminal";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_DIR   = join(__dirname, "auth_info");
const STATE_FILE = join(__dirname, "bot_state.json");
const DB_PATH    = join(__dirname, "..", "data", "axel.db");

mkdirSync(AUTH_DIR, { recursive: true });
mkdirSync(join(__dirname, "..", "data"), { recursive: true });

// ── Database ───────────────────────────────────────────────────────────────
let _db = null;
function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL, contacto TEXT NOT NULL,
      fecha TEXT NOT NULL, hora TEXT NOT NULL,
      paquete TEXT NOT NULL, descripcion TEXT, origen TEXT, destino TEXT,
      precio INTEGER NOT NULL, estado TEXT NOT NULL DEFAULT 'pendiente',
      canal TEXT DEFAULT 'whatsapp',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS blocked_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL, hora TEXT, razon TEXT
    );
  `);
  return _db;
}

const PAQUETES = [
  { id: "basico",      nombre: "Paquete Básico",      precio: 5000,  tiempo_estimado: "2-4 horas" },
  { id: "estandar",    nombre: "Paquete Estándar",    precio: 8000,  tiempo_estimado: "3-5 horas" },
  { id: "grande",      nombre: "Paquete Grande",      precio: 12000, tiempo_estimado: "4-6 horas" },
  { id: "empresarial", nombre: "Paquete Empresarial", precio: 0,     tiempo_estimado: "A coordinar" },
];

const HORARIOS = ["09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00"];

function getAvailableSlots(fecha) {
  const db = getDb();
  const booked  = db.prepare("SELECT hora FROM bookings WHERE fecha = ? AND estado != 'cancelado'").all(fecha).map(r => r.hora);
  const blocked = db.prepare("SELECT hora FROM blocked_slots WHERE fecha = ? AND hora IS NOT NULL").all(fecha).map(r => r.hora);
  const taken = new Set([...booked, ...blocked]);
  return HORARIOS.filter(h => !taken.has(h));
}

function createBookingDb(booking) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO bookings (nombre, contacto, fecha, hora, paquete, descripcion, origen, destino, precio, canal)
    VALUES (@nombre, @contacto, @fecha, @hora, @paquete, @descripcion, @origen, @destino, @precio, @canal)
  `).run(booking);
  return result.lastInsertRowid;
}

// ── Calendar tools ─────────────────────────────────────────────────────────
const CALENDAR_TOOLS = [
  {
    name: "consultar_disponibilidad",
    description: "Consulta los horarios disponibles para agendar un servicio en una fecha específica o los próximos 14 días hábiles.",
    input_schema: {
      type: "object",
      properties: {
        fecha: { type: "string", description: "Fecha en formato YYYY-MM-DD. Si no se provee, devuelve los próximos 14 días." },
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
        paquete:     { type: "string", enum: ["basico", "estandar", "grande", "empresarial"] },
        descripcion: { type: "string" },
        origen:      { type: "string" },
        destino:     { type: "string" },
        canal:       { type: "string" },
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

function executeTool(name, input) {
  if (name === "consultar_paquetes") {
    return JSON.stringify(PAQUETES.map(p => ({
      ...p,
      precio: p.precio === 0 ? "A coordinar" : `$${p.precio.toLocaleString("es-CL")} CLP`,
    })));
  }
  if (name === "consultar_disponibilidad") {
    if (input.fecha) {
      const slots = getAvailableSlots(input.fecha);
      return JSON.stringify({ fecha: input.fecha, horarios_disponibles: slots, disponible: slots.length > 0 });
    }
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
    const pkg = PAQUETES.find(p => p.id === input.paquete);
    if (!pkg) return JSON.stringify({ error: "Paquete inválido" });
    const slots = getAvailableSlots(input.fecha);
    if (!slots.includes(input.hora)) {
      return JSON.stringify({ error: `Horario ${input.hora} no disponible. Disponibles: ${slots.join(", ") || "ninguno"}` });
    }
    const id = createBookingDb({ ...input, precio: pkg.precio, canal: "whatsapp" });
    return JSON.stringify({
      exito: true, id,
      confirmacion: `Reserva #${id} creada para ${input.nombre} el ${input.fecha} a las ${input.hora}. Paquete: ${pkg.nombre}. Precio: ${pkg.precio === 0 ? "a coordinar" : `$${pkg.precio.toLocaleString("es-CL")} CLP`}.`,
    });
  }
  return JSON.stringify({ error: "Herramienta desconocida" });
}

// ── Anthropic client ───────────────────────────────────────────────────────
function getAIClient() {
  const apiKey    = process.env.ANTHROPIC_API_KEY;
  const bearerToken = process.env.ANTHROPIC_BEARER_TOKEN;
  const tokenFile = process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE;
  if (apiKey && !apiKey.startsWith("sk-ant-si-")) {
    return new Anthropic({ apiKey });
  }
  if (bearerToken) {
    return new Anthropic({ apiKey: "placeholder", defaultHeaders: { Authorization: `Bearer ${bearerToken}`, "x-api-key": "" } });
  }
  if (tokenFile && existsSync(tokenFile)) {
    const token = readFileSync(tokenFile, "utf-8").trim();
    return new Anthropic({ apiKey: "placeholder", defaultHeaders: { Authorization: `Bearer ${token}`, "x-api-key": "" } });
  }
  return new Anthropic({ apiKey: apiKey ?? "" });
}

const SYSTEM_PROMPT = `Eres Axel, el asistente virtual de Axel Ruta Express, servicio de logística express en Chile.
Eres amable, profesional y conciso. Habla siempre en español. Responde por WhatsApp.

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
5. Crea la reserva y entrega el número de confirmación

REGLAS:
- Máximo 3 oraciones por respuesta, sé directo
- Puedes usar emojis con moderación
- Si no sabes algo, ofrece conectar con un agente humano
- Hoy es ${new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;

// Historial de conversación por usuario (máx 10 mensajes)
const history = new Map();

async function getAIReply(jid, userText) {
  const client = getAIClient();
  if (!history.has(jid)) history.set(jid, []);
  const msgs = history.get(jid);
  msgs.push({ role: "user", content: userText });
  if (msgs.length > 20) msgs.splice(0, msgs.length - 20);

  let response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: CALENDAR_TOOLS,
    messages: msgs,
  });

  // Agentic tool loop
  while (response.stop_reason === "tool_use") {
    const toolUses = response.content.filter(b => b.type === "tool_use");
    const toolResults = toolUses.map(t => ({
      type: "tool_result",
      tool_use_id: t.id,
      content: executeTool(t.name, t.input),
    }));

    msgs.push({ role: "assistant", content: response.content });
    msgs.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      tools: CALENDAR_TOOLS,
      messages: msgs,
    });
  }

  const textBlock = response.content.find(b => b.type === "text");
  const reply = textBlock?.text ?? "Disculpa, no pude procesar tu mensaje. Intenta de nuevo.";
  msgs.push({ role: "assistant", content: reply });
  return reply;
}

// ── Estado compartido con la web UI ────────────────────────────────────────
let currentQR = null;
let botStatus = "starting";
let activeSock = null; // referencia al socket activo para enviar mensajes

function saveState() {
  writeFileSync(STATE_FILE, JSON.stringify({ status: botStatus, qr: currentQR }));
}

// ── Servidor HTTP interno (puerto 3001) ────────────────────────────────────
function startStatusServer() {
  const server = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/status") {
      res.end(JSON.stringify({ status: botStatus, hasQR: !!currentQR }));
    } else if (req.url === "/qr") {
      res.end(JSON.stringify({ qr: currentQR, status: botStatus }));
    } else if (req.method === "POST" && req.url === "/send") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const { to, message } = JSON.parse(body);
          if (!to || !message) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: "Se requieren to y message" }));
          }
          if (!activeSock || botStatus !== "connected") {
            res.writeHead(503);
            return res.end(JSON.stringify({ error: "Bot no conectado" }));
          }
          const jid = to.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
          await activeSock.sendMessage(jid, { text: message });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else {
      res.writeHead(404);
      res.end("{}");
    }
  });

  server.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.log("⚠️  Puerto 3001 ocupado, reintentando en 2s...");
      setTimeout(() => server.listen(3001), 2000);
    } else {
      console.error("HTTP server error:", e.message);
    }
  });

  server.listen(3001, () => console.log("📡 Status API → http://localhost:3001"));
  return server;
}

// ── WhatsApp bot ───────────────────────────────────────────────────────────
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version }          = await fetchLatestBaileysVersion();

  console.log(`🚀 Axel WhatsApp Bot iniciando (WA v${version.join(".")})`);

  const sock = activeSock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false,
    getMessage: async () => undefined,
  });

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      currentQR = qr;
      botStatus = "qr";
      saveState();
      console.log("\n📱 Escanea este QR con +56 9 2247 4974:");
      console.log("   WhatsApp → Ajustes → Dispositivos vinculados → Vincular dispositivo\n");
      qrcode.generate(qr, { small: true });
      console.log("\nO ve a http://localhost:3000/asistente (tab WhatsApp) para escanear.\n");
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      botStatus = "disconnected";
      currentQR = null;
      saveState();
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`⚠️  Desconectado (código ${code}). Reconectando: ${shouldReconnect}`);
      if (shouldReconnect) setTimeout(startBot, 5000);
      else { console.log("🔒 Sesión cerrada. Elimina bot/auth_info/ y reinicia para re-vincular."); process.exit(0); }
    }
    if (connection === "open") {
      currentQR = null;
      botStatus = "connected";
      saveState();
      console.log("\n✅ ¡WhatsApp conectado! Axel está respondiendo mensajes en +56 9 2247 4974\n");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
    if (type !== "notify") return;
    for (const msg of msgs) {
      if (msg.key.fromMe) continue;
      if (!msg.message)   continue;
      const jid = msg.key.remoteJid ?? "";
      if (jid.endsWith("@g.us")) continue;
      const text =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        "";
      if (!text.trim()) continue;
      const sender = jid.replace("@s.whatsapp.net", "");
      console.log(`💬 [+${sender}]: ${text}`);
      try {
        await sock.sendPresenceUpdate("composing", jid);
        const reply = await getAIReply(jid, text);
        await sock.sendMessage(jid, { text: reply });
        console.log(`🤖 → ${reply.slice(0, 100)}${reply.length > 100 ? "…" : ""}`);
      } catch (err) {
        console.error("Error respondiendo:", err?.message ?? err);
        await sock.sendMessage(jid, {
          text: "Disculpa, tuve un problema técnico. Por favor intenta de nuevo o llama al +56 9 2247 4974.",
        });
      }
    }
  });
}

// ── Start ──────────────────────────────────────────────────────────────────
startStatusServer();
startBot().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
