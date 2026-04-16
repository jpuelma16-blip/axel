/**
 * Axel – Ruta Express · Bot WhatsApp
 *
 * Arranca con: npm run bot
 * Primera vez: escanea el QR con el teléfono +56 9 2247 4974
 *   → WhatsApp → Configuración → Dispositivos vinculados → Vincular dispositivo
 *
 * Luego responde automáticamente con IA todos los mensajes entrantes.
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
import qrcode from "qrcode-terminal";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_DIR  = join(__dirname, "auth_info");
const STATE_FILE = join(__dirname, "bot_state.json");

mkdirSync(AUTH_DIR, { recursive: true });

// ── Anthropic client ───────────────────────────────────────────────────────
function getAIClient() {
  const apiKey    = process.env.ANTHROPIC_API_KEY;
  const tokenFile = process.env.CLAUDE_SESSION_INGRESS_TOKEN_FILE;
  if (apiKey && !apiKey.startsWith("sk-ant-si-")) {
    return new Anthropic({ apiKey });
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

const SYSTEM_PROMPT = `Eres Axel, el asistente virtual de Axel Ruta Express, servicio de logística express en Chile.
Eres amable, profesional y conciso. Habla siempre en español. Responde por WhatsApp.

SERVICIOS:
- Plan Operativa ($29/mes): hasta 500 envíos/mes, seguimiento en tiempo real, soporte por correo
- Plan Pro ($79/mes): envíos ilimitados, rutas con IA, soporte 24/7, integraciones ilimitadas, API access

CONTACTO: +56 9 2247 4974 | axel.com

REGLAS:
- Máximo 3 oraciones, sé directo
- Para rastrear un envío pide el número de guía (10 dígitos)
- Si no sabes algo, ofrece conectar con un agente humano
- Puedes usar emojis con moderación`;

// Historial de conversación por usuario (máx 10 mensajes)
const history = new Map();

async function getAIReply(jid, userText) {
  const client = getAIClient();
  if (!history.has(jid)) history.set(jid, []);
  const msgs = history.get(jid);
  msgs.push({ role: "user", content: userText });
  if (msgs.length > 10) msgs.splice(0, msgs.length - 10);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: msgs,
  });

  const reply = response.content[0]?.text
    ?? "Disculpa, no pude procesar tu mensaje. Intenta de nuevo.";
  msgs.push({ role: "assistant", content: reply });
  return reply;
}

// ── Estado compartido con la web UI ────────────────────────────────────────
let currentQR  = null;
let botStatus  = "starting"; // starting | qr | connected | disconnected

function saveState() {
  writeFileSync(STATE_FILE, JSON.stringify({ status: botStatus, qr: currentQR }));
}

// ── Servidor HTTP interno (puerto 3001) para la web UI ─────────────────────
function startStatusServer() {
  const server = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/status") {
      res.end(JSON.stringify({ status: botStatus, hasQR: !!currentQR }));
    } else if (req.url === "/qr") {
      res.end(JSON.stringify({ qr: currentQR, status: botStatus }));
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

  const sock = makeWASocket({
    version,
    auth: state,
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false,
    getMessage: async () => undefined,
  });

  // Connection events
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
      botStatus  = "disconnected";
      currentQR  = null;
      saveState();
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`⚠️  Desconectado (código ${code}). Reconectando: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(startBot, 5000);
      } else {
        console.log("🔒 Sesión cerrada. Elimina bot/auth_info/ y reinicia para re-vincular.");
        process.exit(0);
      }
    }

    if (connection === "open") {
      currentQR = null;
      botStatus = "connected";
      saveState();
      console.log("\n✅ ¡WhatsApp conectado! Axel está respondiendo mensajes en +56 9 2247 4974\n");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Incoming messages
  sock.ev.on("messages.upsert", async ({ messages: msgs, type }) => {
    if (type !== "notify") return;

    for (const msg of msgs) {
      if (msg.key.fromMe)   continue;
      if (!msg.message)     continue;
      const jid  = msg.key.remoteJid ?? "";
      if (jid.endsWith("@g.us")) continue; // ignorar grupos

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
