// Cliente simple para hablar con evolution

function getEvolutionEnv() {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  if (!baseUrl || !apiKey || !instance) {
    throw new Error(
      "Faltan variables de entorno de Evolution API (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME)."
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, instance };
}
/**
 * Manda un mensaje de texto por WhatsApp usando Evolution API.
 * @param phone Número de destino, sin "@s.whatsapp.net" (ej: "573001234567")
 * @param text Texto a enviar
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<void> {
  const { baseUrl, apiKey, instance } = getEvolutionEnv();

  const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey
    },
    body: JSON.stringify({
      number: phone,
      text
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Evolution API respondió con error ${response.status}: ${body}`);
  }
}
