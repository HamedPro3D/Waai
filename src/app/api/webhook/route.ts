import { NextRequest, NextResponse } from "next/server";
import { getConfig, getHistory, addMessage } from "@/lib/db";
import { askAI } from "@/lib/openrouter";
import { sendWhatsAppMessage } from "@/lib/evolution";
import { extractMessageText, jidToPhone, truncate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido, se esperaba JSON" }, { status: 400 });
  }

  const event = (body?.event || "").toString().toLowerCase();

  if (event !== "messages.upsert") {
    return NextResponse.json({ ignored: true, reason: `evento "${event}" no manejado` });
  }

  const data = body?.data;

  if (!data || data?.key?.fromMe) {
    return NextResponse.json({ ignored: true, reason: "mensaje propio o vacío" });
  }

  const remoteJid: string | undefined = data?.key?.remoteJid;
  const messageText = extractMessageText(data?.message);

  if (!remoteJid || !messageText) {
    return NextResponse.json({ ignored: true, reason: "mensaje sin texto soportado" });
  }

  if (remoteJid.endsWith("@g.us")) {
    return NextResponse.json({ ignored: true, reason: "mensaje de grupo" });
  }

  const phone = jidToPhone(remoteJid);

  try {
    const config = getConfig();
    const history = getHistory(phone);

    const reply = await askAI({
      systemPrompt: config.systemPrompt,
      model: config.model,
      temperature: config.temperature,
      history,
      userMessage: messageText
    });

    const finalReply = truncate(reply);

    addMessage(phone, "user", messageText);
    addMessage(phone, "assistant", finalReply);

    await sendWhatsAppMessage(phone, finalReply);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] Error procesando el mensaje:", error);

    try {
      await sendWhatsAppMessage(
        phone,
        "Uy, tuve un problema respondiendo tu mensaje. ¿Puedes intentar de nuevo en un momento?"
      );
    } catch {
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook listo para recibir mensajes" });
}
