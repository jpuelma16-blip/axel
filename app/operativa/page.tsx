import Link from "next/link";

const features = [
  {
    title: "Seguimiento en tiempo real",
    desc: "Visualiza la ubicación de cada envío en un mapa interactivo actualizado al instante.",
    icon: "📍",
  },
  {
    title: "Hasta 500 envíos/mes",
    desc: "Volumen suficiente para operaciones medianas con picos estacionales cubiertos.",
    icon: "📦",
  },
  {
    title: "Panel de control básico",
    desc: "Dashboard limpio con estado de pedidos, historial y métricas clave.",
    icon: "📊",
  },
  {
    title: "Integración con 1 tienda",
    desc: "Conecta tu tienda en línea (Shopify, WooCommerce, etc.) en minutos.",
    icon: "🔗",
  },
  {
    title: "Soporte por correo",
    desc: "Equipo de soporte disponible de lunes a viernes, respuesta en menos de 24 h.",
    icon: "✉️",
  },
];

export default function OperativaPage() {
  return (
    <main className="flex flex-col items-center min-h-screen">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <Link href="/" className="text-blue-600 font-semibold text-sm hover:underline">
          ← Volver a planes
        </Link>
        <span className="text-gray-400 text-sm">Axel · Ruta Express</span>
      </header>

      {/* Hero */}
      <section className="w-full bg-blue-50 py-16 px-6 text-center">
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
          Plan Operativa
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 mt-4 mb-3">
          Todo lo que necesitas para operar
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto mb-8">
          El plan Operativa es la base perfecta para negocios en crecimiento que buscan eficiencia sin complejidad.
        </p>
        <div className="flex items-baseline justify-center gap-1 mb-8">
          <span className="text-5xl font-extrabold text-gray-900">$29</span>
          <span className="text-gray-400">/mes</span>
        </div>
        <button className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
          Comenzar ahora
        </button>
      </section>

      {/* Features */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Qué incluye el plan</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="bg-blue-600 text-white rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-2">¿Listo para empezar?</h2>
          <p className="text-blue-100 mb-6">Prueba gratis durante 14 días. Sin tarjeta de crédito.</p>
          <button className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Iniciar prueba gratuita
          </button>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          ¿Necesitas más?{" "}
          <Link href="/pro" className="text-indigo-600 font-medium hover:underline">
            Ver plan Pro →
          </Link>
        </p>
      </section>

      <footer className="w-full border-t border-gray-100 py-8 text-center text-gray-400 text-sm mt-auto">
        © {new Date().getFullYear()} Axel · Ruta Express
      </footer>
    </main>
  );
}
