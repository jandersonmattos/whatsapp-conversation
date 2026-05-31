export type PusherEventType =
  | 'message-inbound-received'
  | 'message-outbound-received'
  | 'pusher:connection_established'
  | 'pusher:subscription_succeeded'
  | 'pusher:unsubscription_succeeded'
  | 'pusher:pong'
  | 'pusher:error';

export interface PusherEnvelope<T = unknown> {
  event: PusherEventType | string;
  channel?: string;
  data: T;
}

export interface RealtimeConnectionState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
}
