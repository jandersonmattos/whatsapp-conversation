import { apiRequest } from './client';
import { USE_MOCK_DATA } from './config';
import type { ChatMessage } from '../types/message';
import type { Conversation } from '../types/conversation';
import type { MediaData } from '../types/message';
import type { TemplateVariable } from '../types/template';
import type {
  ConversationApiResponse,
  TwilioMessagesApiResponse,
} from '../types/apiResponses';
import {
  mapConversationResponse,
  mapTwilioMessage,
  sortMessagesByTimestamp,
} from '../utils/apiMappers';
import {
  mockConversation,
  mockMessages,
  mockTemplates,
  DEFAULT_THREAD_ID,
} from '../mocks/mockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const chatApi = {
  getConversation(threadId: string): Promise<Conversation> {
    if (USE_MOCK_DATA) {
      return delay(400).then(() => ({
        ...mockConversation,
        id: threadId || DEFAULT_THREAD_ID,
      }));
    }
    return apiRequest<ConversationApiResponse>(`/threads/${threadId}/conversation`).then(
      mapConversationResponse,
    );
  },

  getMessages(threadId: string): Promise<ChatMessage[]> {
    if (USE_MOCK_DATA) {
      return delay(500).then(() => [...mockMessages]);
    }
    return apiRequest<TwilioMessagesApiResponse>(`/threads/${threadId}/messages`).then(
      (response) => sortMessagesByTimestamp(response.messages.map(mapTwilioMessage)),
    );
  },

  sendTextMessage(threadId: string, message: string): Promise<boolean> {
    if (USE_MOCK_DATA) {
      return delay(600).then(() => {
        mockMessages.push({
          twilioId: `msg-${Date.now()}`,
          direction: 'outbound',
          timestamp: new Date().toISOString(),
          status: 'delivered',
          isMedia: false,
          body: message,
        });
        return true;
      });
    }
    return apiRequest<boolean>(`/threads/${threadId}/messages/text`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  sendMediaMessage(threadId: string, mediaUrl: string): Promise<void> {
    if (USE_MOCK_DATA) {
      return delay(800).then(() => undefined);
    }
    return apiRequest<void>(`/threads/${threadId}/messages/media`, {
      method: 'POST',
      body: JSON.stringify({ mediaUrl }),
    });
  },

  uploadFile(
    threadId: string,
    base64: string,
    filename: string,
    contentType?: string,
  ): Promise<string> {
    if (USE_MOCK_DATA) {
      return delay(500).then(() => `mock-content-version-${Date.now()}`);
    }
    return apiRequest<{ contentVersionId: string }>(`/threads/${threadId}/files`, {
      method: 'POST',
      body: JSON.stringify({ base64, filename, contentType }),
    }).then((r) => r.contentVersionId);
  },

  getMediaUrl(contentVersionId: string): Promise<string> {
    if (USE_MOCK_DATA) {
      return delay(300).then(() => 'https://via.placeholder.com/200');
    }
    return apiRequest<{ mediaUrl: string }>(`/media/${contentVersionId}/url`).then(
      (r) => r.mediaUrl,
    );
  },

  getMedia(mediaResourceUrl: string): Promise<MediaData> {
    if (USE_MOCK_DATA) {
      const isImage = mediaResourceUrl.includes('image');
      return delay(400).then(() => ({
        publicUrl: isImage
          ? 'https://picsum.photos/200/150'
          : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        contentType: isImage ? 'image/jpeg' : 'audio/ogg',
        isAudio: !isImage,
        isImage,
        isVideo: false,
        isAnyOtherMedia: false,
      }));
    }
    return apiRequest<MediaData>(`/media`, {
      method: 'POST',
      body: JSON.stringify({ mediaResourceUrl }),
    });
  },

  setReadConversation(threadId: string): Promise<void> {
    if (USE_MOCK_DATA) {
      return delay(200).then(() => undefined);
    }
    return apiRequest<void>(`/threads/${threadId}/read`, {
      method: 'PATCH',
    });
  },

  getTemplates(threadId: string): Promise<Record<string, string>> {
    if (USE_MOCK_DATA) {
      return delay(400).then(() =>
        Object.fromEntries(mockTemplates.map((t) => [t.name, t.body])),
      );
    }
    return apiRequest<Record<string, string>>(`/threads/${threadId}/templates`);
  },

  getTemplateVariables(
    templateId: string,
    threadId: string,
  ): Promise<Record<string, TemplateVariable>> {
    if (USE_MOCK_DATA) {
      return delay(300).then(() => ({
        '{{1}}': { fieldValue: 'Chuck', fieldLabel: 'Nome do cliente' },
        '{{2}}': { fieldValue: '#12345', fieldLabel: 'Número do caso' },
      }));
    }
    return apiRequest<Record<string, TemplateVariable>>(
      `/threads/${threadId}/templates/${templateId}/variables`,
    );
  },

  sendMessageWithTemplate(
    threadId: string,
    templateId: string,
    message: string,
    spentSecondsToSendTemplate: number,
  ): Promise<boolean> {
    if (USE_MOCK_DATA) {
      return delay(700).then(() => {
        mockMessages.push({
          twilioId: `msg-tpl-${Date.now()}`,
          direction: 'outbound',
          timestamp: new Date().toISOString(),
          status: 'sent',
          isMedia: false,
          body: message,
        });
        return true;
      });
    }
    return apiRequest<boolean>(`/threads/${threadId}/messages/template`, {
      method: 'POST',
      body: JSON.stringify({
        templateId,
        message,
        spentSecondsToSendTemplate,
      }),
    });
  },
};
