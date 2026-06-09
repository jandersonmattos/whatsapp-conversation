import type { EmbedConfig } from '../types/embedContext';
import type { Conversation } from '../types/conversation';

export function applyOwnerContext(
  conversation: Conversation,
  currentUserId: string,
): Conversation {
  return {
    ...conversation,
    currentUserId,
    isOwner: conversation.ownerId === currentUserId,
  };
}

export function resolveEmbedConfig(): EmbedConfig {
  const fromWindow = window.__WHATSAPP_CHAT_EMBED__;
  if (fromWindow?.threadId && fromWindow?.currentUserId) {
    return fromWindow;
  }

  const params = new URLSearchParams(window.location.search);

  return {
    threadId:
      fromWindow?.threadId ??
      params.get('threadId') ??
      params.get('conversationId') ??
      '',
    currentUserId:
      fromWindow?.currentUserId ??
      params.get('userId') ??
      params.get('currentUserId') ??
      '',
    authToken: fromWindow?.authToken ?? params.get('authToken') ?? undefined,
    caseStatus:
      fromWindow?.caseStatus ?? params.get('CaseStatus') ?? undefined,
  };
}
