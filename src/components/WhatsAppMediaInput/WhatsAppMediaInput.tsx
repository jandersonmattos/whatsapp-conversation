import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import { fileToBase64 } from '../../utils/messageUtils';
import './WhatsAppMediaInput.css';

const ACCEPTED_EXTENSIONS = [
  '.mov',
  '.mp3',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.mp4',
  '.m4a',
  '.mpeg',
  '.ogg',
  '.wave',
  '.3gpp',
  '.webm',
  '.amr',
  '.bmp',
  '.tiff',
  '.xlsx',
];

interface WhatsAppMediaInputProps {
  threadId: string;
  onMediaSent?: () => void;
  disabled?: boolean;
}

export function WhatsAppMediaInput({
  threadId,
  onMediaSent,
  disabled,
}: WhatsAppMediaInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !threadId) return;

    try {
      const { base64 } = await fileToBase64(file);
      const contentVersionId = await chatApi.uploadFile(
        threadId,
        base64,
        file.name,
        file.type,
      );
      const mediaUrl = await chatApi.getMediaUrl(contentVersionId);
      await chatApi.sendMediaMessage(threadId, mediaUrl);
      onMediaSent?.();
    } catch {
      alert('Erro ao enviar a mídia.');
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="media-input">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="media-input__hidden"
        onChange={handleFileChange}
        disabled={disabled}
        aria-label="Envio de mídia"
      />
      <button
        type="button"
        className="btn btn-neutral media-input__trigger"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <Paperclip size={16} />
        Envio de mídia
      </button>
    </div>
  );
}
