import { NextRequest } from "next/server";
import twilio from "twilio";

// POST /api/calls/outbound  { to: "+521234567890", message: "..." }
export async function POST(request: NextRequest) {
  const { to, message } = await request.json() as { to?: string; message?: string };

  if (!to || !message) {
    return Response.json({ error: "Se requieren 'to' y 'message'" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return Response.json({ error: "Credenciales de Twilio no configuradas" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    return Response.json({ error: "NEXT_PUBLIC_BASE_URL no configurado" }, { status: 500 });
  }

  const client = twilio(accountSid, authToken);

  // Encode the custom message into the TwiML URL
  const twimlUrl = `${baseUrl}/api/calls/twiml?message=${encodeURIComponent(message)}`;

  const call = await client.calls.create({
    to,
    from,
    url: twimlUrl,
  });

  return Response.json({ callSid: call.sid, status: call.status });
}
