import { getBookings, PAQUETES } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha  = searchParams.get("fecha")  ?? undefined;
  const estado = searchParams.get("estado") ?? undefined;
  const bookings = getBookings({ fecha, estado });
  return Response.json({ bookings, paquetes: PAQUETES });
}
