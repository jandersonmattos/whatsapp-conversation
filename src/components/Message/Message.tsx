import { AlertTriangle } from 'lucide-react';
import type { ChatMessage } from '../../types/message';
import { TextMessage } from '../TextMessage/TextMessage';
import { MediaMessage } from '../MediaMessage/MediaMessage';
import { MessageStatusIcon } from '../MessageStatusIcon/MessageStatusIcon';
import './Message.css';

interface MessageProps {
  message: ChatMessage;
  onMediaLoaded?: (twilioId: string) => void;
}

function isValidTextMessage(message: ChatMessage): boolean {
  return Boolean(
    message.body?.trim() &&
      message.status !== 'error',
  );
}

function isValidMediaMessage(message: ChatMessage): boolean {
  return Boolean(
    message.mediaResourceUrl && message.status !== 'error',
  );
}

export function Message({ message, onMediaLoaded }: MessageProps) {
  const isValid = isValidTextMessage(message) || isValidMediaMessage(message);
  const isReceiving = message.status === 'receiving';
  const isEmpty = !isValid;

  if (isEmpty) return null;

  const formattedTime = new Date(message.timestamp).toLocaleString('pt-BR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <li className={`chat-listitem chat-listitem_${message.direction}`}>
      <div className="chat-message__body">
        {isValid ? (
          message.isMedia ? (
            <MediaMessage message={message} onMediaLoaded={onMediaLoaded} />
          ) : (
            <TextMessage message={message} />
          )
        ) : isReceiving ? (
          <div className="custom-spinner">
            <div className="spinner spinner-small" />
          </div>
        ) : (
          <div className="unsupported-media" title={JSON.stringify(message)}>
            <AlertTriangle size={14} />
            <div className="text">Mídia não suportada!</div>
            <div className="little-text">Esse tipo de mídia não é suportada.</div>
          </div>
        )}
        <div
          className="chat-message__meta"
          data-status={message.status}
          title={message.status}
        >
          <time dateTime={message.timestamp}>{formattedTime}</time>
          <MessageStatusIcon status={message.status} />
        </div>
      </div>
    </li>
  );
}
