import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chatApi } from '../api/chatApi';
import type { ChatMessage } from '../types/message';
import type { Conversation } from '../types/conversation';
import {
  getPaginationIndexes,
  shouldUseWhatsAppTemplates,
} from '../utils/messageUtils';
import { applyOwnerContext } from '../utils/embedUtils';
import { buildPusherChannel } from '../utils/channelUtils';
import { usePusherRealtime } from './usePusherRealtime';

const MESSAGES_PER_PAGE = 20;

interface UseWhatsAppChatOptions {
  threadId: string;
  currentUserId: string;
  authToken?: string;
  realtimeEnabled?: boolean;
}

export function useWhatsAppChat({
  threadId,
  currentUserId,
  authToken: _authToken,
  realtimeEnabled,
}: UseWhatsAppChatOptions) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [allMessages, setAllMessages] = useState<ChatMessage[] | null>(null);
  const [firstIndex, setFirstIndex] = useState(0);
  const [lastIndex, setLastIndex] = useState(-1);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const chatRef = useRef<HTMLElement | null>(null);
  const canSendMessageRef = useRef(false);
  const realtimeConnectedRef = useRef(false);

  realtimeConnectedRef.current = realtimeConnected;

  const pusherChannel = useMemo(() => {
    if (!conversation?.phone || !conversation?.loftPhone) return null;
    return buildPusherChannel(conversation.phone, conversation.loftPhone);
  }, [conversation?.phone, conversation?.loftPhone]);

  const messages = useMemo(() => {
    if (!allMessages || lastIndex < 0) return [];
    return allMessages.slice(firstIndex, lastIndex + 1);
  }, [allMessages, firstIndex, lastIndex]);

  const refreshIndexes = useCallback((msgs: ChatMessage[]) => {
    const { firstIndex: fi, lastIndex: li } = getPaginationIndexes(msgs.length);
    setFirstIndex(fi);
    setLastIndex(li);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const el = chatRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }, []);

  const appendMessage = useCallback(
    (newMessage: ChatMessage) => {
      setAllMessages((prev) => {
        if (!prev) return [newMessage];
        const existingIndex = prev.findIndex((m) => m.twilioId === newMessage.twilioId);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], ...newMessage };
          return next;
        }
        const next = [...prev, newMessage];
        setLastIndex(next.length - 1);
        return next;
      });
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const loadConversation = useCallback(async () => {
    if (!threadId || !currentUserId) return;
    try {
      const conv = await chatApi.getConversation(threadId);
      const withOwner = applyOwnerContext(conv, currentUserId);
      setConversation(withOwner);
      if (withOwner.status === 'In Progress' && !withOwner.read) {
        await chatApi.setReadConversation(threadId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar conversa');
    }
  }, [threadId, currentUserId]);

  const loadMessages = useCallback(async () => {
    if (!threadId) return;
    setLoadingMessages(true);
    try {
      const msgs = await chatApi.getMessages(threadId);
      setAllMessages(msgs);
      refreshIndexes(msgs);
      scrollToBottom();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  }, [threadId, refreshIndexes, scrollToBottom]);

  useEffect(() => {
    loadConversation();
    loadMessages();
  }, [loadConversation, loadMessages]);

  const shouldUseTemplates = useMemo(
    () => (allMessages ? shouldUseWhatsAppTemplates(allMessages) : true),
    [allMessages],
  );

  const canSendMessage = useMemo(() => {
    if (!conversation) return false;
    return (
      conversation.isOwner === true &&
      conversation.status === 'In Progress' &&
      !shouldUseTemplates
    );
  }, [conversation, shouldUseTemplates]);

  canSendMessageRef.current = canSendMessage;

  usePusherRealtime({
    channel: pusherChannel,
    enabled: realtimeEnabled ?? true,
    onConnectionChange: setRealtimeConnected,
    onMessage: (message) => {
      if (!canSendMessageRef.current && message.direction === 'inbound') {
        loadConversation();
      }
      appendMessage(message);
    },
  });

  const loadMore = useCallback(() => {
    setFirstIndex((prev) => Math.max(0, prev - MESSAGES_PER_PAGE));
  }, []);

  const sendTextMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendingMessage) return false;

      setSendingMessage(true);
      try {
        const ok = await chatApi.sendTextMessage(threadId, trimmed);
        if (ok && !realtimeConnectedRef.current) {
          appendMessage({
            twilioId: String(Date.now()),
            direction: 'outbound',
            timestamp: new Date().toISOString(),
            status: 'delivered',
            isMedia: false,
            body: trimmed,
          });
        }
        return ok;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao enviar mensagem');
        return false;
      } finally {
        setSendingMessage(false);
        scrollToBottom();
      }
    },
    [threadId, sendingMessage, appendMessage, scrollToBottom],
  );

  const scrollTop = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = 0;
    }
  }, []);

  return {
    conversation,
    messages,
    allMessages,
    loadingMessages,
    sendingMessage,
    sendingMedia,
    setSendingMedia,
    error,
    setError,
    canSendMessage,
    shouldUseTemplates,
    conversationInProgress: conversation?.status === 'In Progress',
    userAllowedToSendMessage: conversation?.isOwner ?? false,
    hasInProgressConversation: conversation?.status === 'In Progress',
    firstIndex,
    loadMore,
    loadMessages,
    loadConversation,
    sendTextMessage,
    chatRef,
    scrollToBottom,
    scrollTop,
    scrollDown: scrollToBottom,
    realtimeConnected,
    pusherChannel,
  };
}
