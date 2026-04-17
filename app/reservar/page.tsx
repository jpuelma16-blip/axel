"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Paquete = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tiempo_estimado: string;
};

type Slot = { fecha: string; disponibles: number; slots: string[] };

const STEPS = ["Servicio", "Fecha y hora", "Tus datos", "Confirmar"];

export default function ReservarPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 0 — Paquete
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [paquete, setPaquete] = useState("");

  // Step 1 — Fecha & hora
  const [dias, setDias] = useState<Slot[]>([]);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [slotsHoy, setSlotsHoy] = useState<string[]>([]);

  // Step 2 — Datos personales
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");

  useEffect(() => {
    fetch("/api/bookings/availability")
      .then((r) => r.json())
      .then((d) => {
        setPaquetes(d.paquetes ?? []);
        setDias(d.dias ?? []);
      });
  }, []);

  useEffect(() => {
    if (!fecha) return setSlotsHoy([]);
    const found = dias.find((d) => d.fecha === fecha);
    if (found) {
      setSlotsHoy(found.slots);
    } else {
      // fetch específico si la fecha fue ingresada manualmente
      fetch(`/api/bookings/availability?fecha=${fecha}`)
        .then((r) => r.json())
        .then((d) => setSlotsHoy(d.slots_disponibles ?? []));
    }
    setHora("");
  }, [fecha, dias]);

  async function confirmarReserva() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, contacto, fecha, hora, paquete, descripcion, origen, destino, canal: "web" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear la reserva");
      router.push(`/reservar/confirmacion?id=${data.id}&nombre=${encodeURIComponent(nombre)}&fecha=${fecha}&hora=${hora}&paquete=${encodeURIComponent(data.resumen?.paquete ?? paquete)}&precio=${encodeURIComponent(data.resumen?.precio ?? "")}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const pkgSelected = paquetes.find((p) => p.id === paquete);
  const canNext = [
    paquete !== "",
    fecha !== "" && hora !== "",
    nombre.trim() !== "" && contacto.trim() !== "" && origen.trim() !== "" && destino.trim() !== "",
    true,
  ][step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            <span className="text-sm text-gray-600 font-medium">Axel Ruta Express</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda tu servicio</h1>
          <p className="text-gray-500 text-sm mt-1">Rápido, seguro y sin llamadas</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? "bg-blue-600 text-white" :
                i === step ? "bg-blue-600 text-white ring-4 ring-blue-200" :
                "bg-gray-200 text-gray-400"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">{STEPS[step]}</h2>

          {/* Step 0: Paquete */}
          {step === 0 && (
            <div className="space-y-3">
              {paquetes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaquete(p.id)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    paquete === p.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{p.nombre}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{p.descripcion}</div>
                      <div className="text-xs text-gray-400 mt-1">⏱ Tiempo estimado: {p.tiempo_estimado}</div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className="font-bold text-blue-700 text-sm">
                        {p.precio === 0 ? "A coordinar" : `$${p.precio.toLocaleString("es-CL")}`}
                      </div>
                      {p.precio > 0 && <div className="text-xs text-gray-400">CLP</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Fecha & hora */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona una fecha disponible</label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {dias.filter((d) => d.disponibles > 0).map((d) => {
                    const dt = new Date(d.fecha + "T12:00:00");
                    return (
                      <button
                        key={d.fecha}
                        onClick={() => setFecha(d.fecha)}
                        className={`rounded-xl border-2 p-3 text-left transition-all ${
                          fecha === d.fecha ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm capitalize">
                          {dt.toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                        <div className="text-xs text-green-600 mt-0.5">{d.disponibles} horarios libres</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {fecha && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Elige tu horario</label>
                  {slotsHoy.length === 0 ? (
                    <p className="text-sm text-red-500">No hay horarios disponibles para esta fecha.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slotsHoy.map((h) => (
                        <button
                          key={h}
                          onClick={() => setHora(h)}
                          className={`rounded-lg border-2 py-2 text-sm font-medium transition-all ${
                            hora === h ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 hover:border-blue-400 text-gray-700"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Datos */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo o empresa *</label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="ej: Juan Pérez"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="+56 9 XXXX XXXX"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de retiro *</label>
                  <input
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                    placeholder="ej: Av. Providencia 123, Santiago"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega *</label>
                  <input
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="ej: Las Condes 456, Santiago"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué vas a enviar?</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="ej: Caja con ropa y artículos del hogar, aprox. 10 kg"
                    rows={2}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmación */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                <Row label="📦 Paquete" value={pkgSelected?.nombre ?? paquete} />
                <Row label="📅 Fecha" value={fecha ? new Date(fecha + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }) : ""} />
                <Row label="⏰ Hora" value={hora} />
                <Row label="👤 Nombre" value={nombre} />
                <Row label="📱 Contacto" value={contacto} />
                <Row label="📍 Retiro" value={origen} />
                <Row label="📍 Entrega" value={destino} />
                {descripcion && <Row label="📝 Descripción" value={descripcion} />}
                <div className="border-t pt-3 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="text-blue-700">
                    {pkgSelected?.precio === 0 ? "A coordinar" : `$${pkgSelected?.precio.toLocaleString("es-CL")} CLP`}
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Atrás
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Continuar →
              </button>
            ) : (
              <button
                onClick={confirmarReserva}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {loading ? "Confirmando…" : "Confirmar reserva ✓"}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Necesitas ayuda? Escríbenos al{" "}
          <a href="https://wa.me/56922474974" className="text-blue-500 hover:underline">
            +56 9 2247 4974
          </a>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}
