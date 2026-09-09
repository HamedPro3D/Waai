import test from "node:test";
import assert from "node:assert/strict";

function extractMessageText(message) {
  if (!message) return null;

  if (typeof message.conversation === "string" && message.conversation.trim() !== "") {
    return message.conversation.trim();
  }

  if (
    message.extendedTextMessage &&
    typeof message.extendedTextMessage.text === "string" &&
    message.extendedTextMessage.text.trim() !== ""
  ) {
    return message.extendedTextMessage.text.trim();
  }

  if (message.buttonsResponseMessage?.selectedDisplayText) {
    return message.buttonsResponseMessage.selectedDisplayText.trim();
  }
  if (message.listResponseMessage?.title) {
    return message.listResponseMessage.title.trim();
  }

  return null;
}

function jidToPhone(remoteJid) {
  return remoteJid.split("@")[0];
}

function truncate(text, maxLength = 4000) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

test("extractMessageText: mensaje de texto simple", () => {
  const result = extractMessageText({ conversation: "Hola bot!" });
  assert.equal(result, "Hola bot!");
});

test("extractMessageText: mensaje de texto extendido", () => {
  const result = extractMessageText({ extendedTextMessage: { text: "Hola con cita" } });
  assert.equal(result, "Hola con cita");
});

test("extractMessageText: mensaje sin texto soportado devuelve null", () => {
  const result = extractMessageText({ imageMessage: { caption: "una foto" } });
  assert.equal(result, null);
});

test("extractMessageText: mensaje vacío devuelve null", () => {
  assert.equal(extractMessageText(null), null);
  assert.equal(extractMessageText(undefined), null);
});

test("jidToPhone: extrae el número del remoteJid", () => {
  assert.equal(jidToPhone("573001234567@s.whatsapp.net"), "573001234567");
});

test("truncate: no modifica textos cortos", () => {
  assert.equal(truncate("hola", 100), "hola");
});

test("truncate: recorta textos largos y agrega puntos suspensivos", () => {
  const longText = "a".repeat(20);
  const result = truncate(longText, 10);
  assert.equal(result.length, 10);
  assert.ok(result.endsWith("..."));
});
