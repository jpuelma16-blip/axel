import { getAvailableSlots, PAQUETES, HORARIOS } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");

  if (!fecha) {
    // Return next 14 days with availability summary
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends
      const slots = getAvailableSlots(iso);
      days.push({ fecha: iso, disponibles: slots.length, slots });
    }
    return Response.json({ dias: days, paquetes: PAQUETES });
  }

  const slots = getAvailableSlots(fecha);
  return Response.json({
    fecha,
    slots_disponibles: slots,
    slots_totales: HORARIOS.length,
    paquetes: PAQUETES,
  });
}
