export function normalizePhone(phone: string): string {
  return phone.replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '');
}

export function buildPusherChannel(customerPhone: string, loftPhone: string): string {
  return `whatsapp-twilio-${normalizePhone(customerPhone)}-${normalizePhone(loftPhone)}`;
}

export const PUSHER_EVENT_INBOUND = 'message-inbound-received';
export const PUSHER_EVENT_OUTBOUND = 'message-outbound-received';
