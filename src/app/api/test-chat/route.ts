import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/db";
import { askAI, ChatMessage } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON" }, { status: 400 });
  }

  const { message, history } = body as { message?: string; history?: ChatMessage[] };

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Falta el mensaje a enviar." }, { status: 400 });
  }

  try {
    const config = getConfig();

    const reply = await askAI({
      systemPrompt: config.systemPrompt,
      model: config.model,
      temperature: config.temperature,
      history: Array.isArray(history) ? history : [],
      userMessage: message.trim()
    });

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
