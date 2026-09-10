import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/db";

export async function GET() {
  const config = getConfig();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON" }, { status: 400 });
  }

  const { systemPrompt, model, temperature } = body;

  if (typeof systemPrompt !== "string" || systemPrompt.trim().length === 0) {
    return NextResponse.json(
      { error: "El system prompt es obligatorio y debe ser texto." },
      { status: 400 }
    );
  }

  if (typeof model !== "string" || model.trim().length === 0) {
    return NextResponse.json({ error: "Debes elegir un modelo." }, { status: 400 });
  }

  const temp = Number(temperature);
  if (Number.isNaN(temp) || temp < 0 || temp > 2) {
    return NextResponse.json(
      { error: "La temperatura debe ser un número entre 0 y 2." },
      { status: 400 }
    );
  }

  saveConfig({ systemPrompt: systemPrompt.trim(), model: model.trim(), temperature: temp });

  return NextResponse.json({ ok: true });
}
