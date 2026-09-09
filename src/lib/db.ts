import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || "./data/bot.db";

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const globalForDb = globalThis as unknown as { db?: Database.Database };
export const db = globalForDb.db ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
db.pragma("journal_mode = WAL");

// Definición de tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS bot_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    system_prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    temperature REAL NOT NULL DEFAULT 0.7,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
`);

export interface BotConfig {
  systemPrompt: string;
  model: string;
  temperature: number;
}
const DEFAULT_CONFIG: BotConfig = {
  systemPrompt:
    "Eres un asistente virtual de WhatsApp, amable y conciso. Responde siempre en español a menos que te escriban en otro idioma.",
  model: process.env.DEFAULT_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
  temperature: 0.7
};
// Devuelve la configuración actual del bot. Si no existe, crea una por defecto.
export function getConfig(): BotConfig {
  const row = db
    .prepare("SELECT system_prompt, model, temperature FROM bot_config WHERE id = 1")
    .get() as { system_prompt: string; model: string; temperature: number } | undefined;
  if (!row) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  return {
    systemPrompt: row.system_prompt,
    model: row.model,
    temperature: row.temperature
  };
}

//Guarda (crea o actualiza) la configuración del bot. Solo existe una fila (id = 1).
export function saveConfig(config: BotConfig): void {
  db.prepare(
    `INSERT INTO bot_config (id, system_prompt, model, temperature, updated_at)
     VALUES (1, @systemPrompt, @model, @temperature, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       system_prompt = excluded.system_prompt,
       model = excluded.model,
       temperature = excluded.temperature,
       updated_at = excluded.updated_at`
  ).run(config);
}
const MAX_HISTORY_MESSAGES = 10;
// Devuelve los últimos mensajes de una conversación (para darle memoria al bot).
export function getHistory(phone: string): { role: "user" | "assistant"; content: string }[] {
  const rows = db
    .prepare(
      `SELECT role, content FROM messages
       WHERE phone = ?
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(phone, MAX_HISTORY_MESSAGES) as { role: "user" | "assistant"; content: string }[];

  return rows.reverse();
}

// Guarda un mensaje (del usuario o del bot) en el historial de esa conversación.
export function addMessage(phone: string, role: "user" | "assistant", content: string): void {
  db.prepare("INSERT INTO messages (phone, role, content) VALUES (?, ?, ?)").run(
    phone,
    role,
    content
  );
}
