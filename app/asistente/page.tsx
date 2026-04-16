"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "llamar" | "sms";

export default function AsistentePage() {
  const [tab, setTab] = useState<Tab>("llamar");

  // Outbound call state
  const [callTo, setCallTo] = useState("");
  const [callMsg, setCallMsg] = useState("");
  const [callResult, setCallResult] = useState<string | null>(null);
  const [callLoading, setCallLoading] = useState(false);

  // SMS state
  const [smsTo, setSmsTo] = useState("");
  const [smsMsg, setSmsMsg] = useState("");
  const [smsResult, setSmsResult] = useState<string | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);

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
      const data = await res.json() as { callSid?: string; status?: string; error?: string };
      setCallResult(data.error ?? `Llamada iniciada — SID: ${data.callSid} (${data.status})`);
    } catch {
      setCallResult("Error al iniciar la llamada.");
    } finally {
      setCallLoading(false);
    }
  }

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
      const data = await res.json() as { sid?: string; status?: string; error?: string };
      setSmsResult(data.error ?? `SMS enviado — SID: ${data.sid} (${data.status})`);
    } catch {
      setSmsResult("Error al enviar el SMS.");
    } finally {
      setSmsLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center min-h-screen bg-gray-50">
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 font-semibold text-sm hover:underline">
          ← Inicio
        </Link>
        <h1 className="font-bold text-gray-900">Panel del Asistente Virtual</h1>
        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
          Axel · Ruta Express
        </span>
      </header>

      <div className="w-full max-w-2xl mx-auto px-6 py-10">
        {/* Info card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Estado del asistente</h2>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            {[
              { label: "Llamadas entrantes", route: "/api/voice/inbound", color: "blue" },
              { label: "SMS entrantes", route: "/api/sms/inbound", color: "indigo" },
              { label: "Llamadas salientes", route: "/api/calls/outbound", color: "purple" },
            ].map((item) => (
              <div key={item.route} className={`bg-${item.color}-50 rounded-xl p-3`}>
                <p className={`font-mono text-xs text-${item.color}-600 mb-1`}>{item.route}</p>
                <span className={`inline-block bg-${item.color}-100 text-${item.color}-700 text-xs font-semibold px-2 py-0.5 rounded-full`}>
                  activo
                </span>
                <p className="text-gray-600 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("llamar")}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              tab === "llamar"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            📞 Llamar
          </button>
          <button
            onClick={() => setTab("sms")}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              tab === "sms"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            💬 Enviar SMS
          </button>
        </div>

        {/* Call form */}
        {tab === "llamar" && (
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
                placeholder="+521234567890"
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
              <p className="text-sm text-center text-gray-600 bg-gray-50 rounded-xl p-3">
                {callResult}
              </p>
            )}
          </form>
        )}

        {/* SMS form */}
        {tab === "sms" && (
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
                placeholder="+521234567890"
                value={smsTo}
                onChange={(e) => setSmsTo(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
              <textarea
                placeholder="Tu envío #12345 está en camino..."
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
              <p className="text-sm text-center text-gray-600 bg-gray-50 rounded-xl p-3">
                {smsResult}
              </p>
            )}
          </form>
        )}

        {/* Webhook config guide */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-900">
          <h3 className="font-semibold mb-1">Configuración de webhooks en Twilio</h3>
          <p className="mb-1 text-amber-700">
            Número configurado:{" "}
            <span className="font-mono font-bold">+56 9 2247 4974</span>
          </p>
          <p className="mb-3 text-amber-700">Apunta estos URLs en tu número de Twilio:</p>
          <ul className="space-y-2 font-mono text-xs">
            <li>
              <span className="font-sans font-semibold text-amber-800">Llamadas entrantes → </span>
              POST <code>https://TU-DOMINIO/api/voice/inbound</code>
            </li>
            <li>
              <span className="font-sans font-semibold text-amber-800">SMS entrantes → </span>
              POST <code>https://TU-DOMINIO/api/sms/inbound</code>
            </li>
          </ul>
        </div>
      </div>

      <footer className="w-full border-t border-gray-100 py-8 text-center text-gray-400 text-sm mt-auto">
        © {new Date().getFullYear()} Axel · Ruta Express
      </footer>
    </main>
  );
}
