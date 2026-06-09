import { useEffect, useRef } from 'react';
import { REALTIME_ENABLED, REALTIME_WS_URL } from '../api/config';
import { pusherWebSocketClient } from '../services/realtime/pusherWebSocketClient';
import type { ChatMessage } from '../types/message';
import { mapInboundMessage } from '../utils/realtimeMappers';

interface UsePusherRealtimeOptions {
  channel: string | null;
  enabled?: boolean;
  onMessage: (message: ChatMessage) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function usePusherRealtime({
  channel,
  enabled = REALTIME_ENABLED,
  onMessage,
  onConnectionChange,
}: UsePusherRealtimeOptions) {
  const handlersRef = useRef({ onMessage, onConnectionChange });

  handlersRef.current = { onMessage, onConnectionChange };

  useEffect(() => {
    if (!enabled || !channel) {
      return;
    }

    pusherWebSocketClient.subscribe({
      channel,
      wsUrl: REALTIME_WS_URL,
      handlers: {
        onMessageReceived: (data) => {
          const message = mapInboundMessage(data);
          handlersRef.current.onMessage(message);
        },
        onConnectionChange: (connected) => {
          handlersRef.current.onConnectionChange?.(connected);
        },
      },
    });

    return () => {
      pusherWebSocketClient.unsubscribe();
    };
  }, [channel, enabled]);
}
