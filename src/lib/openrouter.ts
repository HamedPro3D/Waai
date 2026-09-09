// Cliente de uso con openrouter

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AskAIParams {
  systemPrompt: string;
  model: string;
  temperature: number;
  history: ChatMessage[];
  userMessage: string;
}

export async function askAI({
  systemPrompt,
  model,
  temperature,
  history,
  userMessage
}: AskAIParams): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENROUTER_API_KEY en el archivo .env");
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/",
        "X-Title": "WA AI Bot"
      },
      body: JSON.stringify({
        model,
        temperature,
        messages
      }),
      signal: controller.signal
    });
  } catch (err) {
    throw new Error(
      "No se pudo contactar a OpenRouter (revisa tu conexión a internet): " +
        (err as Error).message
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    if (response.status === 429) {
      throw new Error(
        `El modelo "${model}" está saturado en este momento (429). Prueba con otro modelo gratuito desde el panel.`
      );
    }

    throw new Error(`OpenRouter respondió con error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenRouter no devolvió ningún texto en la respuesta.");
  }

  return text.trim();
}

// Modelos gratuitos "de respaldo"
export const FALLBACK_FREE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free"
];
