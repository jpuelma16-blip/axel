"use client";

import { useState, useEffect, useCallback } from "react";

type Booking = {
  id: number;
  nombre: string;
  contacto: string;
  fecha: string;
  hora: string;
  paquete: string;
  descripcion?: string;
  origen?: string;
  destino?: string;
  precio: number;
  estado: string;
  canal: string;
  created_at: string;
};

const ESTADOS = ["pendiente", "confirmado", "en_camino", "entregado", "cancelado"];
const ESTADO_COLOR: Record<string, string> = {
  pendiente:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmado:  "bg-blue-100 text-blue-800 border-blue-200",
  en_camino:   "bg-purple-100 text-purple-800 border-purple-200",
  entregado:   "bg-green-100 text-green-800 border-green-200",
  cancelado:   "bg-red-100 text-red-700 border-red-200",
};
const ESTADO_DOT: Record<string, string> = {
  pendiente:  "bg-yellow-400",
  confirmado: "bg-blue-500",
  en_camino:  "bg-purple-500",
  entregado:  "bg-green-500",
  cancelado:  "bg-red-400",
};

function isoToDisplay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1).getDay(); // 0=Sun
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first + 6) % 7; // Mon-start
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarioPage() {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [filterEstado, setFilterEstado] = useState("");
  const [updating, setUpdating]   = useState(false);

  const load = useCallback(async () => {
    const url = filterEstado ? `/api/bookings?estado=${filterEstado}` : "/api/bookings";
    const data = await fetch(url).then((r) => r.json());
    setBookings(data.bookings ?? []);
  }, [filterEstado]);

  useEffect(() => { load(); }, [load]);

  async function updateEstado(id: number, estado: string) {
    setUpdating(true);
    await fetch("/api/bookings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    await load();
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, estado } : null);
    setUpdating(false);
  }

  const cells = monthMatrix(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("es-CL", {
    month: "long", year: "numeric",
  });

  function bookingsForDay(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter((b) => b.fecha === iso);
  }

  const upcomingBookings = bookings
    .filter((b) => b.fecha >= today.toISOString().split("T")[0])
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
          <div>
            <h1 className="font-bold text-gray-900">Calendario de Reservas</h1>
            <p className="text-xs text-gray-500">Axel Ruta Express — Panel Admin</p>
          </div>
        </div>
        <a href="/reservar" target="_blank" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
          + Nueva reserva
        </a>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => {
                const d = new Date(viewYear, viewMonth - 1);
                setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
              }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">‹</button>
              <h2 className="font-semibold text-gray-900 capitalize">{monthName}</h2>
              <button onClick={() => {
                const d = new Date(viewYear, viewMonth + 1);
                setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
              }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">›</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const dayBookings = bookingsForDay(day);
                const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = iso === today.toISOString().split("T")[0];
                return (
                  <div
                    key={i}
                    className={`min-h-14 rounded-xl p-1.5 border transition-all ${
                      isToday ? "border-blue-400 bg-blue-50" : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? "text-blue-700" : "text-gray-600"}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelected(b)}
                          className={`w-full text-left text-xs px-1.5 py-0.5 rounded-md border font-medium truncate ${ESTADO_COLOR[b.estado] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                        >
                          {b.hora} {b.nombre.split(" ")[0]}
                        </button>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-400 pl-1">+{dayBookings.length - 3} más</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 px-1">
            {ESTADOS.map((e) => (
              <div key={e} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`w-2 h-2 rounded-full ${ESTADO_DOT[e]}`} />
                <span className="capitalize">{e.replace("_", " ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* Filter */}
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">Filtrar por estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1).replace("_", " ")}</option>
              ))}
            </select>
          </div>

          {/* Selected booking detail */}
          {selected && (
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{selected.nombre}</h3>
                  <p className="text-xs text-gray-500">Reserva #{selected.id} · {selected.canal}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
              </div>

              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <p>📱 {selected.contacto}</p>
                <p>📅 {isoToDisplay(selected.fecha)} · {selected.hora}</p>
                <p>📦 {selected.paquete} · {selected.precio === 0 ? "A coordinar" : `$${selected.precio.toLocaleString("es-CL")} CLP`}</p>
                {selected.origen  && <p>📍 Retiro: {selected.origen}</p>}
                {selected.destino && <p>📍 Entrega: {selected.destino}</p>}
                {selected.descripcion && <p>📝 {selected.descripcion}</p>}
              </div>

              {/* Estado badge */}
              <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border mb-3 ${ESTADO_COLOR[selected.estado]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT[selected.estado]}`} />
                {selected.estado.replace("_", " ")}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                {ESTADOS.filter((e) => e !== selected.estado).map((e) => (
                  <button
                    key={e}
                    onClick={() => updateEstado(selected.id, e)}
                    disabled={updating}
                    className="text-xs py-1.5 px-2 rounded-lg border border-gray-200 hover:bg-gray-50 capitalize disabled:opacity-50 transition"
                  >
                    → {e.replace("_", " ")}
                  </button>
                ))}
              </div>

              <a
                href={`https://wa.me/${selected.contacto.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${selected.nombre.split(" ")[0]}, te confirmamos tu reserva #${selected.id} para el ${selected.fecha} a las ${selected.hora}. ¡Nos vemos pronto! — Axel Ruta Express`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full text-center text-xs py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition block"
              >
                💬 Contactar por WhatsApp
              </a>
            </div>
          )}

          {/* Upcoming list */}
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Próximas reservas</h3>
            {upcomingBookings.length === 0 ? (
              <p className="text-xs text-gray-400">No hay reservas próximas.</p>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className={`w-full text-left rounded-xl border px-3 py-2 hover:shadow-sm transition ${
                      selected?.id === b.id ? "ring-2 ring-blue-400" : ""
                    } ${ESTADO_COLOR[b.estado] ?? ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-xs">{b.nombre}</p>
                        <p className="text-xs opacity-70">{isoToDisplay(b.fecha)} · {b.hora}</p>
                      </div>
                      <span className="text-xs opacity-70 capitalize">{b.paquete}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
