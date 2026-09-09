
export function extractMessageText(message: any): string | null {
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

export function jidToPhone(remoteJid: string): string {
  return remoteJid.split("@")[0];
}

/** Recorta un texto largo para no mandar mensajes gigantes por WhatsApp. */
export function truncate(text: string, maxLength = 4000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
