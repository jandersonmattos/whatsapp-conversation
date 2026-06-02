import type { PusherEnvelope } from '../../types/realtime';
import { OMNITALK_EVENT_INBOUND } from '../../utils/channelUtils';

export interface OmniTalkNotificationPayload {
  id: string;
  threadId: string;
  sourceId?: string;
  title: string;
  description: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface OmniTalkInboundPayload {
  notifications: OmniTalkNotificationPayload[];
  timestamp: string;
}

export interface OmniTalkWsHandlers {
  onInbound?: (payload: OmniTalkInboundPayload) => void;
  onConnectionChange?: (connected: boolean) => void;
  onEnvelope?: (envelope: PusherEnvelope) => void;
  onError?: (message: string) => void;
  onLog?: (message: string) => void;
}

interface ConnectOptions {
  wsUrl: string;
  ownerId: string;
  handlers: OmniTalkWsHandlers;
}

/**
 * WebSocket client for OmniTalk notifications (same protocol as Salesforce omniTalk LWC).
 */
export class OmniTalkWsClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private options: ConnectOptions | null = null;
  private subscribedChannel: string | null = null;

  connect(options: ConnectOptions) {
    this.disconnect();
    this.options = options;
    this.intentionalClose = false;
    this.openSocket();
  }

  disconnect() {
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

  private log(message: string) {
    this.options?.handlers.onLog?.(message);
  }

  private openSocket() {
    if (!this.options) return;

    const { wsUrl, ownerId, handlers } = this.options;
    const channel = `omnitalk-notifications-${ownerId}`;

    this.log(`Connecting to ${wsUrl}…`);

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'WebSocket connection failed';
      handlers.onError?.(msg);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.log(`Connected. Subscribing to ${channel}`);
      this.send({ action: 'subscribe', channel });
    };

    this.socket.onmessage = (event) => {
      try {
        const envelope = JSON.parse(String(event.data)) as PusherEnvelope;
        handlers.onEnvelope?.(envelope);
        this.handleEnvelope(envelope);
      } catch {
        handlers.onError?.('Invalid message payload');
      }
    };

    this.socket.onerror = () => {
      handlers.onError?.('WebSocket error');
    };

    this.socket.onclose = () => {
      this.log('Connection closed');
      handlers.onConnectionChange?.(false);
      this.subscribedChannel = null;
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private handleEnvelope(envelope: PusherEnvelope) {
    const handlers = this.options?.handlers;
    if (!handlers) return;

    switch (envelope.event) {
      case 'pusher:connection_established':
        this.log('pusher:connection_established');
        break;
      case 'pusher:subscription_succeeded':
        this.subscribedChannel = envelope.channel ?? null;
        this.log(`Subscribed: ${envelope.channel}`);
        handlers.onConnectionChange?.(true);
        break;
      case OMNITALK_EVENT_INBOUND:
        if (envelope.data && typeof envelope.data === 'object') {
          handlers.onInbound?.(envelope.data as OmniTalkInboundPayload);
        }
        break;
      case 'pusher:error':
        handlers.onError?.(
          typeof envelope.data === 'object' &&
            envelope.data !== null &&
            'message' in envelope.data
            ? String((envelope.data as { message: string }).message)
            : 'Pusher error',
        );
        break;
      default:
        if (envelope.event) {
          this.log(`Event: ${envelope.event}`);
        }
        break;
    }
  }

  private send(payload: object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private scheduleReconnect() {
    if (this.intentionalClose || !this.options) return;
    if (this.reconnectTimer) return;

    this.log('Reconnecting in 3s…');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, 3000);
  }
}

export const omniTalkWsClient = new OmniTalkWsClient();
