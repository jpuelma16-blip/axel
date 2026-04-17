import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-24 px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-200 mb-3">
          Axel
        </p>
        <h1 className="text-5xl font-extrabold mb-4">Ruta Express</h1>
        <p className="text-xl text-blue-100 max-w-xl mx-auto mb-8">
          Gestiona tu logística de forma ágil. Elige el plan que se adapta a tu operación.
        </p>
        <Link
          href="/asistente"
          className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
        >
          💬 Hablar con el asistente
        </Link>
      </section>

      {/* Pricing */}
      <section className="w-full max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">Elige tu plan</h2>
        <p className="text-center text-gray-500 mb-12">Sin costos ocultos. Cancela cuando quieras.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Operativa */}
          <div className="border border-gray-200 rounded-2xl p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                Operativa
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Ideal para equipos pequeños que necesitan una solución confiable para el día a día.
            </p>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-gray-900">$29</span>
              <span className="text-gray-400 text-sm ml-1">/mes</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1 text-sm text-gray-600">
              {[
                "Hasta 500 envíos/mes",
                "Seguimiento en tiempo real",
                "Panel de control básico",
                "Soporte por correo electrónico",
                "Integración con 1 tienda",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.17l7.879-7.88a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/operativa"
              className="block text-center bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Ver plan Operativa
            </Link>
          </div>

          {/* Pro */}
          <div className="border-2 border-indigo-600 rounded-2xl p-8 flex flex-col shadow-lg relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
              Más popular
            </span>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                Pro
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Para empresas que necesitan escala, automatización y soporte prioritario.
            </p>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-gray-900">$79</span>
              <span className="text-gray-400 text-sm ml-1">/mes</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1 text-sm text-gray-600">
              {[
                "Envíos ilimitados",
                "Seguimiento en tiempo real + alertas",
                "Panel avanzado con analítica",
                "Soporte prioritario 24/7",
                "Integraciones ilimitadas",
                "Rutas optimizadas con IA",
                "Acceso a API",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.17l7.879-7.88a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pro"
              className="block text-center bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Ver plan Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-100 py-8 text-center text-gray-400 text-sm mt-auto">
        © {new Date().getFullYear()} Axel · Ruta Express
      </footer>
    </main>
  );
}
