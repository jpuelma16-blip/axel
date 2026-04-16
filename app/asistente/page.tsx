"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Tab = "chat" | "llamar" | "sms";
type Msg = { role: "user" | "assistant"; content: string };

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

    const assistantMsg: Msg = { role: "assistant", content: "" };
    setMessages([...newMsgs, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      if (!res.body) throw new Error("No stream");
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
      setMessages([
        ...newMsgs,
        { role: "assistant", content: "Ocurrió un error. Intenta de nuevo." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

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
      const data = (await res.json()) as {
        callSid?: string;
        status?: string;
        error?: string;
      };
      setCallResult(
        data.error ?? `✅ Llamada iniciada — SID: ${data.callSid} (${data.status})`
      );
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
      const data = (await res.json()) as {
        sid?: string;
        status?: string;
        error?: string;
      };
      setSmsResult(
        data.error ?? `✅ SMS enviado — SID: ${data.sid} (${data.status})`
      );
    } catch {
      setSmsResult("❌ Error al enviar el SMS.");
    } finally {
      setSmsLoading(false);
    }
  }

  return (
    <main className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 font-semibold text-sm hover:underline">
          ← Inicio
        </Link>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-sm">Asistente Virtual</p>
          <p className="text-xs text-gray-400">+56 9 2247 4974</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
          activo
        </span>
      </header>

      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([
            { id: "chat", label: "💬 Chat web" },
            { id: "llamar", label: "📞 Llamar" },
            { id: "sms", label: "✉️ SMS" },
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

        {/* ── CHAT TAB ── */}
        {tab === "chat" && (
          <div className="flex flex-col flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[420px] max-h-[520px]">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0 mt-0.5">
                      A
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                    {m.role === "assistant" && streaming && i === messages.length - 1 && (
                      <span className="inline-block w-1.5 h-3.5 bg-gray-400 ml-1 animate-pulse rounded-sm" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="flex items-center gap-2 border-t border-gray-100 p-3"
            >
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

        {/* ── LLAMAR TAB ── */}
        {tab === "llamar" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
              <strong>Número origen:</strong> +56 9 2247 4974 · El asistente Axel
              contestará y responderá preguntas con IA.
            </div>
            <form
              onSubmit={handleCall}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h3 className="font-semibold text-gray-900">Llamada saliente</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número destino
                </label>
                <input
                  type="tel"
                  placeholder="+56912345678"
                  value={callTo}
                  onChange={(e) => setCallTo(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje para el cliente
                </label>
                <textarea
                  placeholder="Hola, te contactamos de Axel Ruta Express para informarte que tu envío..."
                  value={callMsg}
                  onChange={(e) => setCallMsg(e.target.value)}
                  required
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={callLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {callLoading ? "Marcando..." : "Iniciar llamada"}
              </button>
              {callResult && (
                <p className="text-sm text-center text-gray-700 bg-gray-50 rounded-xl p-3">
                  {callResult}
                </p>
              )}
            </form>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
              Requiere credenciales Twilio en <code>.env.local</code> para hacer llamadas reales.
            </div>
          </div>
        )}

        {/* ── SMS TAB ── */}
        {tab === "sms" && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800">
              <strong>Número origen:</strong> +56 9 2247 4974 · El asistente Axel
              responde automáticamente los mensajes entrantes con IA.
            </div>
            <form
              onSubmit={handleSms}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4"
            >
              <h3 className="font-semibold text-gray-900">Enviar SMS</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número destino
                </label>
                <input
                  type="tel"
                  placeholder="+56912345678"
                  value={smsTo}
                  onChange={(e) => setSmsTo(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  placeholder="Tu envío #12345 está en camino y llegará hoy..."
                  value={smsMsg}
                  onChange={(e) => setSmsMsg(e.target.value)}
                  required
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={smsLoading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {smsLoading ? "Enviando..." : "Enviar SMS"}
              </button>
              {smsResult && (
                <p className="text-sm text-center text-gray-700 bg-gray-50 rounded-xl p-3">
                  {smsResult}
                </p>
              )}
            </form>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
              Requiere credenciales Twilio en <code>.env.local</code> para SMS reales.
              Webhooks de Twilio → <code>/api/sms/inbound</code> (SMS) y{" "}
              <code>/api/voice/inbound</code> (llamadas).
            </div>
          </div>
        )}
      </div>

      <footer className="w-full border-t border-gray-100 py-6 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Axel · Ruta Express · +56 9 2247 4974
      </footer>
    </main>
  );
}
