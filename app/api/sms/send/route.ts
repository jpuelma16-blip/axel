import { NextRequest } from "next/server";
import twilio from "twilio";

// POST /api/sms/send  { to: "+521234567890", message: "..." }
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

  const client = twilio(accountSid, authToken);

  const msg = await client.messages.create({ to, from, body: message });

  return Response.json({ sid: msg.sid, status: msg.status });
}
