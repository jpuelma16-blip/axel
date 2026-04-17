/**
 * Envía notificación WhatsApp al admin cuando se crea una reserva.
 * Llama al bot en localhost:3001/send (puerto interno del WhatsApp bot).
 */

const BOT_URL = "http://localhost:3001/send";

export async function notifyAdmin(booking: {
  id: number;
  nombre: string;
  contacto: string;
  fecha: string;
  hora: string;
  paquete: string;
  paqueteNombre: string;
  descripcion?: string;
  origen?: string;
  destino?: string;
  precio: number;
  canal?: string;
}) {
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return; // sin número configurado, no notificar

  const precio = booking.precio === 0
    ? "A coordinar"
    : `$${booking.precio.toLocaleString("es-CL")} CLP`;

  const lines = [
    `🚨 *NUEVA RESERVA #${booking.id}*`,
    ``,
    `👤 *Cliente:* ${booking.nombre}`,
    `📱 *Contacto:* ${booking.contacto}`,
    `📦 *Paquete:* ${booking.paqueteNombre}`,
    `📅 *Fecha:* ${formatFecha(booking.fecha)}`,
    `⏰ *Hora:* ${booking.hora}`,
    booking.origen   ? `📍 *Retiro:* ${booking.origen}`   : null,
    booking.destino  ? `📍 *Entrega:* ${booking.destino}` : null,
    booking.descripcion ? `📝 *Descripción:* ${booking.descripcion}` : null,
    `💰 *Precio:* ${precio}`,
    `📲 *Canal:* ${booking.canal ?? "web"}`,
    ``,
    `_Responde directamente al cliente o actualiza el estado en /admin/calendario_`,
  ].filter((l) => l !== null);

  const message = lines.join("\n");

  try {
    const res = await fetch(BOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: adminPhone, message }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn(`[notify] Bot respondió ${res.status} — WhatsApp no disponible aún`);
    }
  } catch {
    // Bot no corriendo o no conectado — no bloquea la reserva
    console.warn("[notify] No se pudo notificar al admin (bot offline)");
  }
}

function formatFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
