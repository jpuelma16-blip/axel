import Link from "next/link";

const features = [
  {
    title: "Envíos ilimitados",
    desc: "Sin techo de volumen. Escala tu operación sin preocuparte por límites mensuales.",
    icon: "♾️",
  },
  {
    title: "Rutas optimizadas con IA",
    desc: "El motor de IA calcula la ruta más eficiente en tiempo y costo para cada pedido.",
    icon: "🤖",
  },
  {
    title: "Panel avanzado con analítica",
    desc: "Reportes detallados, tendencias, tasa de entrega y predicción de demanda.",
    icon: "📈",
  },
  {
    title: "Integraciones ilimitadas",
    desc: "Conecta todas tus tiendas, marketplaces y ERP desde un solo lugar.",
    icon: "🔌",
  },
  {
    title: "Soporte prioritario 24/7",
    desc: "Línea directa con un gestor de cuenta dedicado. Respuesta en menos de 1 hora.",
    icon: "🎯",
  },
  {
    title: "Acceso a API",
    desc: "Integra Axel directamente en tu stack con nuestra API REST documentada.",
    icon: "⚡",
  },
  {
    title: "Alertas y notificaciones",
    desc: "SMS, email y webhooks automáticos en cada cambio de estado del envío.",
    icon: "🔔",
  },
  {
    title: "Multi-usuario y roles",
    desc: "Agrega a tu equipo con permisos personalizados por rol.",
    icon: "👥",
  },
];

export default function ProPage() {
  return (
    <main className="flex flex-col items-center min-h-screen">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <Link href="/" className="text-indigo-600 font-semibold text-sm hover:underline">
          ← Volver a planes
        </Link>
        <span className="text-gray-400 text-sm">Axel · Ruta Express</span>
      </header>

      {/* Hero */}
      <section className="w-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 px-6 text-center">
        <div className="flex justify-center gap-2 mb-4">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Plan Pro
          </span>
          <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full">
            Más popular
          </span>
        </div>
        <h1 className="text-4xl font-extrabold mt-2 mb-3">
          Potencia tu operación al máximo
        </h1>
        <p className="text-indigo-100 max-w-lg mx-auto mb-8">
          El plan Pro elimina todos los límites. Automatización inteligente, analítica profunda y soporte de élite para empresas que no se detienen.
        </p>
        <div className="flex items-baseline justify-center gap-1 mb-8">
          <span className="text-5xl font-extrabold">$79</span>
          <span className="text-indigo-200">/mes</span>
        </div>
        <button className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
          Comenzar ahora
        </button>
      </section>

      {/* Features */}
      <section className="w-full max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Todo lo del plan Operativa, más:</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison nudge */}
      <section className="w-full max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-1">¿Empezando desde cero?</h3>
            <p className="text-gray-500 text-sm">
              El plan Operativa puede ser un mejor punto de partida. Siempre puedes upgradear cuando lo necesites.
            </p>
          </div>
          <Link
            href="/operativa"
            className="shrink-0 bg-white border border-indigo-200 text-indigo-700 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
          >
            Ver plan Operativa
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-2">Prueba Pro sin riesgo</h2>
          <p className="text-indigo-100 mb-6">14 días gratis. Sin tarjeta de crédito. Cancela cuando quieras.</p>
          <button className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
            Iniciar prueba gratuita
          </button>
        </div>
      </section>

      <footer className="w-full border-t border-gray-100 py-8 text-center text-gray-400 text-sm mt-auto">
        © {new Date().getFullYear()} Axel · Ruta Express
      </footer>
    </main>
  );
}
