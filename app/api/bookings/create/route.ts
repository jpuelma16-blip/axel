import { createBooking, getAvailableSlots, PAQUETES } from "@/lib/db";
import { notifyAdmin } from "@/lib/notify";

export async function POST(request: Request) {
  const body = await request.json();
  const { nombre, contacto, fecha, hora, paquete, descripcion, origen, destino, canal } = body;

  if (!nombre || !contacto || !fecha || !hora || !paquete) {
    return Response.json({ error: "Faltan campos obligatorios: nombre, contacto, fecha, hora, paquete" }, { status: 400 });
  }

  const pkg = PAQUETES.find((p) => p.id === paquete);
  if (!pkg) {
    return Response.json({ error: `Paquete inválido. Opciones: ${PAQUETES.map((p) => p.id).join(", ")}` }, { status: 400 });
  }

  const disponibles = getAvailableSlots(fecha);
  if (!disponibles.includes(hora)) {
    return Response.json({
      error: `Horario ${hora} no disponible el ${fecha}. Horarios disponibles: ${disponibles.join(", ") || "ninguno"}`,
    }, { status: 409 });
  }

  const id = createBooking({
    nombre, contacto, fecha, hora, paquete,
    descripcion, origen, destino,
    precio: pkg.precio,
    canal: canal ?? "web",
  });

  // Notificación al admin (fire-and-forget, no bloquea la respuesta)
  notifyAdmin({
    id, nombre, contacto, fecha, hora,
    paquete, paqueteNombre: pkg.nombre,
    descripcion, origen, destino,
    precio: pkg.precio,
    canal: canal ?? "web",
  });

  return Response.json({
    success: true,
    id,
    resumen: {
      id,
      nombre,
      fecha,
      hora,
      paquete: pkg.nombre,
      precio: pkg.precio === 0 ? "A coordinar" : `$${pkg.precio.toLocaleString("es-CL")} CLP`,
      tiempo_estimado: pkg.tiempo_estimado,
    },
  });
}
