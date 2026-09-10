import { NextResponse } from "next/server";
import { FALLBACK_FREE_MODELS } from "@/lib/openrouter";

interface OpenRouterModel {
  id: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
}

export async function GET() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter respondió ${response.status}`);
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data?.data || [];

    const freeModels = models
      .filter((m) => m.id.endsWith(":free") || m.pricing?.prompt === "0")
      .map((m) => ({ id: m.id, name: m.name || m.id }))
      .sort((a, b) => a.id.localeCompare(b.id));

    if (freeModels.length === 0) {
      throw new Error("OpenRouter no devolvió modelos gratuitos");
    }

    return NextResponse.json({ models: freeModels, source: "openrouter" });
  } catch (error) {
    console.warn("[models] usando lista de respaldo:", (error as Error).message);

    return NextResponse.json({
      models: FALLBACK_FREE_MODELS.map((id) => ({ id, name: id })),
      source: "fallback"
    });
  }
}
