import { getAIResponse } from "@/lib/assistant";
import type Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  // Run the full agentic loop (may call calendar tools internally)
  const text = await getAIResponse(
    messages as Anthropic.MessageParam[],
    "web"
  );

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
