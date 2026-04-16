"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type Tab = "chat" | "whatsapp" | "llamar" | "sms";
type Msg = { role: "user" | "assistant"; content: string };
type BotStatus = "offline" | "starting" | "qr" | "connected" | "disconnected";

export default function AsistentePage() {
  const [tab, setTab] = useState<Tab>("chat");

  /* ── CHAT ── */
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hola, soy Axel 👋 El asistente virtual de Ruta Express. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const newMsgs: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setStreaming(true);
    setMessages([...newMsgs, { role: "assistant", content: "" }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages([...newMsgs, { role: "assistant", content: full }]);
      }
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "Ocurrió un error. Intenta de nuevo." }]);
    } finally {
      setStreaming(false);
    }
  }

  /* ── WHATSAPP BOT STATUS ── */
  const [botStatus, setBotStatus] = useState<BotStatus>("offline");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollBotStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/bot?endpoint=qr", { cache: "no-store" });
      const data = (await res.json()) as { status: BotStatus; qr?: string | null };
      setBotStatus(data.status);
      if (data.qr) {
        const url = await QRCode.toDataURL(data.qr, { width: 260, margin: 2 });
        setQrDataUrl(url);
      } else {
        setQrDataUrl(null);
      }
    } catch {
      setBotStatus("offline");
    }
  }, []);

  useEffect(() => {
    if (tab === "whatsapp") {
      pollBotStatus();
      pollRef.current = setInterval(pollBotStatus, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tab, pollBotStatus]);

  /* ── LLAMADAS ── */
  const [callTo, setCallTo] = useState("");
  const [callMsg, setCallMsg] = useState("");
  const [callResult, setCallResult] = useState<string | null>(null);
  const [callLoading, setCallLoading] = useState(false);

  async function handleCall(e: React.FormEvent) {
    e.preventDefault();
    setCallLoading(true);
    setCallResult(null);
    try {
      const res = await fetch("/api/calls/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: callTo, message: callMsg }),
      });
      const data = (await res.json()) as { callSid?: string; status?: string; error?: string };
      setCallResult(data.error ?? `✅ Llamada iniciada — SID: ${data.callSid} (${data.status})`);
    } catch {
      setCallResult("❌ Error al iniciar la llamada.");
    } finally {
      setCallLoading(false);
    }
  }

  /* ── SMS ── */
  const [smsTo, setSmsTo] = useState("");
  const [smsMsg, setSmsMsg] = useState("");
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);

  async function handleSms(e: React.FormEvent) {
    e.preventDefault();
    setSmsLoading(true);
    setSmsResult(null);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: smsTo, message: smsMsg }),
      });
      const data = (await res.json()) as { sid?: string; status?: string; error?: string };
      setSmsResult(data.error ?? `✅ SMS enviado — SID: ${data.sid} (${data.status})`);
    } catch {
      setSmsResult("❌ Error al enviar el SMS.");
    } finally {
      setSmsLoading(false);
    }
  }

  const statusColor: Record<BotStatus, string> = {
    offline: "bg-gray-100 text-gray-500",
    starting: "bg-yellow-100 text-yellow-700",
    qr: "bg-blue-100 text-blue-700",
    connected: "bg-green-100 text-green-700",
    disconnected: "bg-red-100 text-red-700",
  };
  const statusLabel: Record<BotStatus, string> = {
    offline: "Bot offline",
    starting: "Iniciando...",
    qr: "Esperando QR",
    connected: "✅ Conectado",
    disconnected: "Desconectado",
  };

  return (
    <main className="flex flex-col min-h-screen bg-gray-50">
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 font-semibold text-sm hover:underline">← Inicio</Link>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-sm">Asistente Virtual</p>
          <p className="text-xs text-gray-400">+56 9 2247 4974</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[botStatus]}`}>
          {statusLabel[botStatus]}
        </span>
      </header>

      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {([
            { id: "chat",      label: "💬 Chat web" },
            { id: "whatsapp",  label: "🟢 WhatsApp" },
            { id: "llamar",    label: "📞 Llamar" },
            { id: "sms",       label: "✉️ SMS" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CHAT ── */}
        {tab === "chat" && (
          <div className="flex flex-col flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[420px] max-h-[520px]">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0 mt-0.5">A</div>
                  )}
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    {m.content}
                    {m.role === "assistant" && streaming && i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-3.5 bg-gray-400 ml-1 animate-pulse rounded-sm" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-gray-100 p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                disabled={streaming}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {streaming ? "..." : "Enviar"}
              </button>
            </form>
          </div>
        )}

        {/* ── WHATSAPP ── */}
        {tab === "whatsapp" && (
          <div className="space-y-4">
            {botStatus === "connected" && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="font-bold text-green-800 text-lg mb-1">WhatsApp conectado</h3>
                <p className="text-green-700 text-sm">
                  El asistente Axel está respondiendo automáticamente todos los mensajes de WhatsApp en{" "}
                  <strong>+56 9 2247 4974</strong>
                </p>
              </div>
            )}

            {botStatus === "qr" && qrDataUrl && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-1">Vincula WhatsApp</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Abre WhatsApp en <strong>+56 9 2247 4974</strong> →{" "}
                  <strong>Configuración → Dispositivos vinculados → Vincular dispositivo</strong>
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR WhatsApp" className="mx-auto rounded-xl" width={260} height={260} />
                <p className="text-xs text-gray-400 mt-3">QR se actualiza automáticamente</p>
              </div>
            )}

            {(botStatus === "starting") && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3 animate-spin">⚙️</div>
                <h3 className="font-bold text-yellow-800">Iniciando bot...</h3>
                <p className="text-yellow-700 text-sm mt-1">Espera unos segundos y aparecerá el QR.</p>
              </div>
            )}

            {(botStatus === "offline" || botStatus === "disconnected") && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">📴</div>
                <h3 className="font-bold text-gray-700 mb-1">Bot no iniciado</h3>
                <p className="text-gray-500 text-sm mb-4">Ejecuta este comando en la terminal:</p>
                <code className="block bg-gray-900 text-green-400 rounded-xl px-4 py-3 text-sm font-mono">
                  npm run bot
                </code>
                <p className="text-xs text-gray-400 mt-3">Esta página detectará el QR automáticamente.</p>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-xs text-gray-500 space-y-1">
              <p><strong className="text-gray-700">Cómo funciona:</strong></p>
              <p>1. Corre <code className="bg-gray-100 px-1 rounded">npm run bot</code> en la terminal</p>
              <p>2. Escanea el QR con el teléfono del número de negocio</p>
              <p>3. Listo — Axel responde automáticamente con IA</p>
              <p>4. El bot mantiene historial de conversación por usuario</p>
            </div>
          </div>
        )}

        {/* ── LLAMAR ── */}
        {tab === "llamar" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
              <strong>Número origen:</strong> +56 9 2247 4974 · El asistente Axel contestará con IA.
            </div>
            <form onSubmit={handleCall} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900">Llamada saliente</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número destino</label>
                <input type="tel" placeholder="+56912345678" value={callTo} onChange={(e) => setCallTo(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea placeholder="Hola, tu envío está en camino..." value={callMsg} onChange={(e) => setCallMsg(e.target.value)} required rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <button type="submit" disabled={callLoading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {callLoading ? "Marcando..." : "Iniciar llamada"}
              </button>
              {callResult && <p className="text-sm text-center text-gray-700 bg-gray-50 rounded-xl p-3">{callResult}</p>}
            </form>
            <p className="text-xs text-center text-gray-400">Requiere credenciales Twilio en .env.local</p>
          </div>
        )}

        {/* ── SMS ── */}
        {tab === "sms" && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800">
              <strong>Número origen:</strong> +56 9 2247 4974
            </div>
            <form onSubmit={handleSms} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900">Enviar SMS</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número destino</label>
                <input type="tel" placeholder="+56912345678" value={smsTo} onChange={(e) => setSmsTo(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea placeholder="Tu envío #12345 está en camino..." value={smsMsg} onChange={(e) => setSmsMsg(e.target.value)} required rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <button type="submit" disabled={smsLoading} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {smsLoading ? "Enviando..." : "Enviar SMS"}
              </button>
              {smsResult && <p className="text-sm text-center text-gray-700 bg-gray-50 rounded-xl p-3">{smsResult}</p>}
            </form>
            <p className="text-xs text-center text-gray-400">Requiere credenciales Twilio en .env.local</p>
          </div>
        )}
      </div>

      <footer className="w-full border-t border-gray-100 py-6 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Axel · Ruta Express · +56 9 2247 4974
      </footer>
    </main>
  );
}
