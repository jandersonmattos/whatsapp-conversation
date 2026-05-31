import type { PusherEnvelope } from '../../types/realtime';
import {
  PUSHER_EVENT_INBOUND,
  PUSHER_EVENT_OUTBOUND,
} from '../../utils/channelUtils';

export interface PusherRealtimeHandlers {
  onMessageReceived?: (data: Record<string, unknown>) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

interface SubscribeOptions {
  channel: string;
  wsUrl: string;
  handlers: PusherRealtimeHandlers;
}

/**
 * WebSocket client compatible with the Pusher simulator protocol.
 * Same channel/event model as Salesforce whatsappChat LWC.
 */
export class PusherSimulatorClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private options: SubscribeOptions | null = null;
  private subscribedChannel: string | null = null;

  subscribe(options: SubscribeOptions) {
    this.unsubscribe();
    this.options = options;
    this.intentionalClose = false;
    this.connect();
  }

  unsubscribe() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket && this.subscribedChannel) {
      this.send({ action: 'unsubscribe', channel: this.subscribedChannel });
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.subscribedChannel = null;
    this.options?.handlers.onConnectionChange?.(false);
    this.options = null;
  }

  private connect() {
    if (!this.options) return;

    const { wsUrl, handlers } = this.options;

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (e) {
      handlers.onError?.(e instanceof Error ? e.message : 'WebSocket connection failed');
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.sendSubscribe();
    };

    this.socket.onmessage = (event) => {
      try {
        const envelope = JSON.parse(String(event.data)) as PusherEnvelope;
        this.handleEnvelope(envelope);
      } catch {
        handlers.onError?.('Invalid realtime message payload');
      }
    };

    this.socket.onerror = () => {
      handlers.onError?.('WebSocket error');
    };

    this.socket.onclose = () => {
      handlers.onConnectionChange?.(false);
      this.subscribedChannel = null;
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private sendSubscribe() {
    if (!this.options) return;
    this.send({ action: 'subscribe', channel: this.options.channel });
  }

  private send(payload: object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private handleEnvelope(envelope: PusherEnvelope) {
    const handlers = this.options?.handlers;
    if (!handlers) return;

    switch (envelope.event) {
      case 'pusher:connection_established':
        break;
      case 'pusher:subscription_succeeded':
        this.subscribedChannel = envelope.channel ?? this.options?.channel ?? null;
        handlers.onConnectionChange?.(true);
        break;
      case PUSHER_EVENT_INBOUND:
      case PUSHER_EVENT_OUTBOUND:
        if (envelope.data && typeof envelope.data === 'object') {
          handlers.onMessageReceived?.(envelope.data as Record<string, unknown>);
        }
        break;
      case 'pusher:error':
        handlers.onError?.(
          typeof envelope.data === 'object' && envelope.data !== null && 'message' in envelope.data
            ? String((envelope.data as { message: string }).message)
            : 'Pusher error',
        );
        break;
      default:
        break;
    }
  }

  private scheduleReconnect() {
    if (this.intentionalClose || !this.options) return;
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}

export const pusherSimulatorClient = new PusherSimulatorClient();
