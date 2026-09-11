"use client";

import { useEffect, useState } from "react";

interface ModelOption {
  id: string;
  name: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AdminPanel() {
  // ── Estado de la configuración del bot ──────────────────────────
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);

  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelsSource, setModelsSource] = useState<"openrouter" | "fallback" | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Estado del chat de prueba (nice to have) ────────────────────
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Al cargar la página, traemos la config guardada y la lista de modelos.
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [configRes, modelsRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/models")
        ]);

        const config = await configRes.json();
        const modelsData = await modelsRes.json();

        setSystemPrompt(config.systemPrompt);
        setModel(config.model);
        setTemperature(config.temperature);

        setModels(modelsData.models || []);
        setModelsSource(modelsData.source || null);
      } catch (err) {
        setError("No se pudo cargar la configuración inicial. Revisa la consola del servidor.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, model, temperature })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar la configuración.");
      }

      setSaveMessage("Configuración guardada ✅");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestMessage() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: text }];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: chatHistory })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "El bot no pudo responder.");
      }

      setChatHistory([...newHistory, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setChatHistory([
        ...newHistory,
        {
          role: "assistant",
          content: `⚠️ Error: ${err instanceof Error ? err.message : "desconocido"}`
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Cargando panel...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-whatsapp-dark"> WAAI Bot — Panel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura la personalidad, el modelo y la temperatura del bot de WhatsApp.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Configuración del bot</h2>

        <div className="mb-4">
          <label htmlFor="systemPrompt" className="mb-1 block text-sm font-medium text-gray-700">
            System prompt (personalidad e instrucciones)
          </label>
          <textarea
            id="systemPrompt"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none focus:ring-1 focus:ring-whatsapp-green"
            rows={5}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Eres un asistente virtual amable que responde preguntas sobre..."
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="model" className="mb-1 block text-sm font-medium text-gray-700">
              Modelo de OpenRouter (gratuito)
            </label>
            <select
              id="model"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none focus:ring-1 focus:ring-whatsapp-green"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {!models.find((m) => m.id === model) && model && (
                <option value={model}>{model}</option>
              )}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {modelsSource === "fallback" && (
              <p className="mt-1 text-xs text-amber-600">
                No se pudo consultar OpenRouter en vivo, mostrando lista de respaldo.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="temperature" className="mb-1 block text-sm font-medium text-gray-700">
              Temperatura: {temperature.toFixed(1)}
            </label>
            <input
              id="temperature"
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-whatsapp-green"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Predecible</span>
              <span>Creativo</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-whatsapp-green px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
          {saveMessage && <span className="text-sm text-whatsapp-dark">{saveMessage}</span>}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Probar el bot</h2>
        <p className="mb-4 text-sm text-gray-500">
          Este chat de prueba habla directo con la IA (usando la configuración de arriba), sin
          pasar por WhatsApp. Útil para ajustar el prompt rápido.
        </p>

        <div className="mb-3 h-64 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3">
          {chatHistory.length === 0 && (
            <p className="text-sm text-gray-400">Escribe algo abajo para empezar a probar...</p>
          )}
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-whatsapp-green text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && <p className="text-xs text-gray-400">El bot está escribiendo...</p>}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-whatsapp-green focus:outline-none focus:ring-1 focus:ring-whatsapp-green"
            placeholder="Escribe un mensaje de prueba..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendTestMessage()}
          />
          <button
            onClick={handleSendTestMessage}
            disabled={chatLoading}
            className="rounded-md bg-whatsapp-dark px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-gray-400">
        Recuerda tener Evolution API corriendo en Docker y el webhook configurado para que los
        mensajes de WhatsApp lleguen hasta acá. Ver README.md.
      </footer>
    </main>
  );
}
