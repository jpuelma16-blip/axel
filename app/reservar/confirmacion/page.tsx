"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ConfirmacionContent() {
  const params = useSearchParams();
  const id     = params.get("id");
  const nombre = params.get("nombre") ?? "";
  const fecha  = params.get("fecha") ?? "";
  const hora   = params.get("hora") ?? "";
  const paquete = params.get("paquete") ?? "";
  const precio = params.get("precio") ?? "";

  const fechaFormateada = fecha
    ? new Date(fecha + "T12:00:00").toLocaleDateString("es-CL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full">

        {/* Success icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Reserva confirmada!</h1>
          <p className="text-gray-500 mt-1 text-sm">Te esperamos, {nombre.split(" ")[0]}.</p>
        </div>

        {/* Booking card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-500">Reserva</span>
            <span className="bg-blue-100 text-blue-700 font-bold text-sm px-3 py-1 rounded-full">#{id}</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">📦 Paquete</span>
              <span className="font-medium text-gray-900">{paquete}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">📅 Fecha</span>
              <span className="font-medium text-gray-900 capitalize">{fechaFormateada}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">⏰ Hora</span>
              <span className="font-medium text-gray-900">{hora} hrs</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-green-700">{precio}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 mb-6">
          <p className="font-medium mb-1">¿Qué sigue?</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Nuestro equipo confirmará tu reserva por WhatsApp</li>
            <li>• El retiro se realizará a la hora acordada</li>
            <li>• Ante cualquier duda escríbenos al <strong>+56 9 2247 4974</strong></li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={`https://wa.me/56922474974?text=Hola%2C+tengo+la+reserva+%23${id}+para+el+${encodeURIComponent(fecha)}+a+las+${encodeURIComponent(hora)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold text-center hover:bg-green-600 transition"
          >
            💬 Confirmar por WhatsApp
          </a>
          <Link
            href="/"
            className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium text-center hover:bg-gray-50 transition"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense>
      <ConfirmacionContent />
    </Suspense>
  );
}
