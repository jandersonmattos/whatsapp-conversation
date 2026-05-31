import type { ChatMessage } from '../types/message';

const MESSAGES_PER_PAGE = 20;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function shouldUseWhatsAppTemplates(
  messages: ChatMessage[],
  lastReceivedMessage?: ChatMessage,
): boolean {
  const inboundReceived = messages.filter(
    (m) => m.status === 'received' && m.direction === 'inbound',
  );
  const lastInbound = inboundReceived[inboundReceived.length - 1];

  if (!lastInbound) {
    return true;
  }

  const reference = lastReceivedMessage ?? lastInbound;
  const diff = Date.now() - new Date(reference.timestamp).getTime();
  return diff >= TWENTY_FOUR_HOURS_MS;
}

export function getPaginationIndexes(length: number): {
  firstIndex: number;
  lastIndex: number;
} {
  if (length === 0) {
    return { firstIndex: 0, lastIndex: -1 };
  }
  const lastIndex = length - 1;
  let firstIndex = lastIndex - MESSAGES_PER_PAGE + 1;
  if (firstIndex < 0) {
    firstIndex = 0;
  }
  return { firstIndex, lastIndex };
}

export function extractTemplateParams(message: string): string[] {
  return message.match(/(\{\{\d\}\})/g) ?? [];
}

export function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      resolve({ base64, dataUrl: result });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
