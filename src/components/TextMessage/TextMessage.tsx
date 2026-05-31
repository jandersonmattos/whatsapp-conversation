import type { ChatMessage } from '../../types/message';
import './TextMessage.css';

interface TextMessageProps {
  message: ChatMessage;
}

function getMessageClass(message: ChatMessage): string {
  const base = 'chat-message__text';
  if (message.status === 'sent') {
    return `${base} chat-message__text_outbound-agent`;
  }
  if (message.status === 'undelivered' || message.status === 'error') {
    return `${base} chat-message__text_delivery-failure`;
  }
  return `${base} chat-message__text_${message.direction}`;
}

export function TextMessage({ message }: TextMessageProps) {
  return (
    <div className="msg-background">
      <div className={getMessageClass(message)}>
        <span>{message.body}</span>
      </div>
    </div>
  );
}
