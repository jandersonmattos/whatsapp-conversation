import type { ConversationApiResponse, TwilioMessageApi } from '../types/apiResponses';
import type { Conversation } from '../types/conversation';
import type { ChatMessage, MessageStatus } from '../types/message';

function mapTwilioStatus(status: string, direction: string): MessageStatus {
  const normalized = status.toLowerCase();
  if (normalized === 'read') return 'read';
  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'sent') return 'sent';
  if (normalized === 'received' || normalized === 'receiving') return 'received';
  if (normalized === 'failed' || normalized === 'undelivered') return 'failed';
  if (direction.startsWith('outbound')) return 'delivered';
  return 'received';
}

function parseTwilioDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

export function mapConversationResponse(data: ConversationApiResponse): Conversation {
  return {
    id: data.Id,
    status: data.Status__c,
    phone: data.Phone__c,
    loftPhone: data.LoftPhone__c,
    read: false,
    customerName: data.ClientName,
    ownerId: data.OwnerId__c ?? '',
  };
}

export function mapTwilioMessage(message: TwilioMessageApi): ChatMessage {
  const isInbound = message.direction === 'inbound';
  const numMedia = Number.parseInt(message.num_media, 10) || 0;

  return {
    twilioId: message.sid,
    direction: isInbound ? 'inbound' : 'outbound',
    timestamp: parseTwilioDate(message.date_sent || message.date_created),
    status: mapTwilioStatus(message.status, message.direction),
    isMedia: numMedia > 0,
    body: message.body,
  };
}

export function sortMessagesByTimestamp(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
