// Proxy to bot status server running on port 3001
export async function GET(request: Request) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint") ?? "status";

  try {
    const res = await fetch(`http://localhost:3001/${endpoint}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ status: "offline", hasQR: false, qr: null });
  }
}
