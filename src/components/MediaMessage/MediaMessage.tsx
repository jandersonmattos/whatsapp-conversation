import { useEffect, useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, FileText, User } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import type { ChatMessage, MediaData } from '../../types/message';
import './MediaMessage.css';

interface MediaMessageProps {
  message: ChatMessage;
  onMediaLoaded?: (twilioId: string) => void;
}

export function MediaMessage({ message, onMediaLoaded }: MediaMessageProps) {
  const [mediaData, setMediaData] = useState<MediaData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!message.mediaResourceUrl) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    chatApi
      .getMedia(message.mediaResourceUrl)
      .then((data) => {
        if (!cancelled) {
          setMediaData(data);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          onMediaLoaded?.(message.twilioId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [message.mediaResourceUrl, message.twilioId, onMediaLoaded]);

  const isContact = mediaData?.contentType === 'text/vcard';
  const isPdf = mediaData?.contentType?.includes('pdf');
  const isXlsx = mediaData?.contentType?.includes(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );

  const isInvalidMedia =
    message.status === 'failed' ||
    (message.status === 'received' &&
      mediaData &&
      (!mediaData.publicUrl ||
        (mediaData.isAnyOtherMedia &&
          mediaData.contentType !== 'text/vcard' &&
          !mediaData.contentType.includes('pdf'))));

  const hasError =
    loadError || (!mediaData && message.status === 'received');

  const isLoaded =
    message.status === 'failed' ||
    (message.status !== 'receiving' && mediaData && !hasError);

  if (isInvalidMedia) {
    return (
      <div className="media-message" data-direction={message.direction}>
        <div className="invalid-media" title={JSON.stringify(message)}>
          <AlertTriangle size={14} />
          <div className="title">Mídia não suportada!</div>
          <div className="description">Esse tipo de mídia não é suportada.</div>
          {message.body && <span>{message.body}</span>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="media-message" data-direction={message.direction}>
        <div className="custom-spinner" title={JSON.stringify(message)}>
          <div className="spinner spinner-small" />
        </div>
      </div>
    );
  }

  if (!isLoaded || hasError) {
    return (
      <div className="media-message" data-direction={message.direction}>
        <div className="media-alert" role="alert">
          <AlertTriangle size={14} />
          <span>Erro ao carregar a mídia. Recarregue a página</span>
        </div>
      </div>
    );
  }

  const url = mediaData!.publicUrl;

  return (
    <div className="media-message" data-direction={message.direction}>
      {mediaData!.isAudio && (
        <div className="media-audio">
          <audio src={url} controls />
        </div>
      )}
      {mediaData!.isImage && (
        <div className="media-image-wrap">
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt="" className="media-image" />
          </a>
        </div>
      )}
      {mediaData!.isVideo && (
        <div className="media-video-wrap">
          <a href={url} target="_blank" rel="noreferrer">
            <video width={220} height={140} controls src={url} />
          </a>
        </div>
      )}
      {mediaData!.isAnyOtherMedia && isContact && (
        <div className="media-card media-contact">
          <header>
            <User size={18} />
            <span>Contato</span>
          </header>
          <footer>
            <a href={url} target="_blank" rel="noreferrer">
              <Download size={14} />
              <span>Download</span>
            </a>
          </footer>
        </div>
      )}
      {mediaData!.isAnyOtherMedia && isPdf && (
        <div className="media-card media-pdf">
          <header>
            <FileText size={24} />
            <span>{message.body?.slice(0, 15) ?? 'Arquivo PDF'}</span>
          </header>
          <footer>
            <a href={url} target="_blank" rel="noreferrer">
              <Download size={14} />
              <span>Download</span>
            </a>
          </footer>
        </div>
      )}
      {mediaData!.isAnyOtherMedia && isXlsx && (
        <div className="media-card media-excel">
          <header>
            <FileSpreadsheet size={24} />
            <span>{message.body?.slice(0, 15) ?? 'Arquivo Xlsx'}</span>
          </header>
          <footer>
            <a href={url} target="_blank" rel="noreferrer">
              <Download size={14} />
              <span>Download</span>
            </a>
          </footer>
        </div>
      )}
    </div>
  );
}
