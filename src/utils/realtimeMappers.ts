import type { ChatMessage } from '../types/message';

/** Maps external service / legacy Salesforce field names to app models */
export function mapInboundMessage(raw: Record<string, unknown>): ChatMessage {
  return {
    twilioId: String(raw.twilioId ?? raw.twilio_id__c ?? raw.id ?? Date.now()),
    direction: (raw.direction ?? raw.Direction__c ?? 'inbound') as ChatMessage['direction'],
    timestamp: String(
      raw.timestamp ?? raw.Timestamp__c ?? new Date().toISOString(),
    ),
    status: (raw.status ?? raw.Status__c ?? 'received') as ChatMessage['status'],
    isMedia: Boolean(raw.isMedia ?? raw.IsMedia__c),
    body: raw.body != null ? String(raw.body) : raw.Body__c != null ? String(raw.Body__c) : undefined,
    mediaResourceUrl:
      raw.mediaResourceUrl != null
        ? String(raw.mediaResourceUrl)
        : raw.MediaResourceUrl__c != null
          ? String(raw.MediaResourceUrl__c)
          : undefined,
  };
}

export function mapMessageUpdate(raw: Record<string, unknown>): Partial<ChatMessage> & { twilioId: string } {
  const mapped = mapInboundMessage(raw);
  return {
    twilioId: mapped.twilioId,
    status: mapped.status,
    body: mapped.body,
    mediaResourceUrl: mapped.mediaResourceUrl,
  };
}
