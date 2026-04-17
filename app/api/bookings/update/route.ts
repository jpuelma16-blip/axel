import { updateBookingStatus } from "@/lib/db";

export async function POST(request: Request) {
  const { id, estado } = await request.json();
  if (!id || !estado) return Response.json({ error: "Se requieren id y estado" }, { status: 400 });
  updateBookingStatus(Number(id), estado);
  return Response.json({ success: true });
}
