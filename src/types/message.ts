export type MessageDirection = 'inbound' | 'outbound';

export type MessageStatus =
  | 'read'
  | 'sent'
  | 'delivered'
  | 'delivering'
  | 'queued'
  | 'receiving'
  | 'received'
  | 'failed'
  | 'error'
  | 'undelivered';

export interface ChatMessage {
  twilioId: string;
  direction: MessageDirection;
  timestamp: string;
  status: MessageStatus;
  isMedia: boolean;
  body?: string;
  mediaResourceUrl?: string;
}

export interface MediaData {
  publicUrl: string;
  contentType: string;
  isAudio: boolean;
  isImage: boolean;
  isVideo: boolean;
  isAnyOtherMedia: boolean;
}
