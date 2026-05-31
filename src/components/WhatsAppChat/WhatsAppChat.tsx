import { useCallback, useState } from 'react';
import { RefreshCw, Send, User, TriangleAlert, X } from 'lucide-react';
import { useWhatsAppChat } from '../../hooks/useWhatsAppChat';
import { chatApi } from '../../api/chatApi';
import { fileToBase64 } from '../../utils/messageUtils';
import { Message } from '../Message/Message';
import { AudioRecorder } from '../AudioRecorder/AudioRecorder';
import { WhatsAppMediaInput } from '../WhatsAppMediaInput/WhatsAppMediaInput';
import { WhatsAppOutbound } from '../WhatsAppOutbound/WhatsAppOutbound';
import './WhatsAppChat.css';

interface WhatsAppChatProps {
  threadId: string;
  currentUserId: string;
  authToken?: string;
  realtimeEnabled?: boolean;
}

export function WhatsAppChat({
  threadId,
  currentUserId,
  authToken,
  realtimeEnabled,
}: WhatsAppChatProps) {
  const {
    conversation,
    messages,
    allMessages,
    loadingMessages,
    sendingMessage,
    sendingMedia,
    setSendingMedia,
    canSendMessage,
    shouldUseTemplates,
    conversationInProgress,
    userAllowedToSendMessage,
    hasInProgressConversation,
    firstIndex,
    loadMore,
    loadMessages,
    sendTextMessage,
    chatRef,
    scrollToBottom,
    realtimeConnected,
  } = useWhatsAppChat({
    threadId,
    currentUserId,
    authToken,
    realtimeEnabled,
  });

  const [textMessage, setTextMessage] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{
    base64: string;
    filename: string;
  } | null>(null);

  const isSendEnabled =
    (textMessage.trim() && !sendingMessage) || (pastedImage && !sendingMedia);

  const handleSend = useCallback(async () => {
    if (textMessage.trim() && !sendingMessage) {
      const ok = await sendTextMessage(textMessage);
      if (ok) setTextMessage('');
    }

    if (pastedImage && fileData && !sendingMedia) {
      setSendingMedia(true);
      try {
        const contentVersionId = await chatApi.uploadFile(
          threadId,
          fileData.base64,
          fileData.filename,
        );
        const mediaUrl = await chatApi.getMediaUrl(contentVersionId);
        await chatApi.sendMediaMessage(threadId, mediaUrl);
        loadMessages();
      } catch {
        alert('Erro ao enviar imagem.');
      } finally {
        setPastedImage(null);
        setFileData(null);
        setSendingMedia(false);
        scrollToBottom();
      }
    }
  }, [
    textMessage,
    sendingMessage,
    pastedImage,
    fileData,
    sendingMedia,
    sendTextMessage,
    threadId,
    setSendingMedia,
    loadMessages,
    scrollToBottom,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!e.shiftKey && e.key === 'Enter' && !sendingMessage) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        const { base64, dataUrl } = await fileToBase64(file);
        setPastedImage(dataUrl);
        setFileData({ base64, filename: file.name });
        break;
      }
    }
  };

  const removePastedImage = () => {
    setPastedImage(null);
    setFileData(null);
  };

  if (!allMessages) {
    return (
      <div className="chat-loading">
        <div className="spinner spinner-brand" />
        <span className="sr-only">Carregando</span>
      </div>
    );
  }

  return (
    <div className="omni-chat-container">
      <div className="header">
        <div className="omni-chat-header-container">
          <div className="header-info">
            <div className="user-icon">
              <User size={16} />
            </div>
            <span className="name">{conversation?.customerName ?? ''}</span>
            <span className="phone">{conversation?.phone ?? ''}</span>
            <span
              className={`realtime-dot ${realtimeConnected ? 'realtime-dot--live' : ''}`}
              title={realtimeConnected ? 'Tempo real conectado' : 'Tempo real desconectado'}
              aria-label={realtimeConnected ? 'Tempo real conectado' : 'Tempo real desconectado'}
            />
          </div>
          {!loadingMessages && (
            <div className="omni-chat-btn-container">
              <button
                type="button"
                className="icon-btn reload-messages-btn"
                onClick={loadMessages}
                aria-label="Recarregar mensagens"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <section
        ref={chatRef}
        role="log"
        className="chat-panel"
        aria-live="polite"
      >
        <ul className="chat-list">
          {firstIndex > 0 && (
            <li className="load-more-container">
              <button type="button" className="btn btn-neutral" onClick={loadMore}>
                Carregar mais mensagens
              </button>
            </li>
          )}
          {messages.map((item) => (
            <Message
              key={item.twilioId}
              message={item}
              onMediaLoaded={() => scrollToBottom()}
            />
          ))}
        </ul>
      </section>

      <div className="chat-footer" onKeyDown={handleKeyDown}>
        {canSendMessage ? (
          <>
            <div className="input-row">
              <div className="input-col">
                <textarea
                  className="message-input"
                  disabled={sendingMessage}
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  onPaste={handlePaste}
                  maxLength={1500}
                  placeholder="Digite aqui sua mensagem (Pressione enter para enviar a mensagem)"
                  rows={2}
                />
                {pastedImage && (
                  <>
                    <button
                      type="button"
                      className="btn-remove-image"
                      onClick={removePastedImage}
                      aria-label="Remover imagem"
                    >
                      <X size={14} />
                    </button>
                    <div className="image-paste-box">
                      <img
                        className="image-thumb"
                        src={pastedImage}
                        alt="Imagem colada"
                        width={200}
                        height={150}
                      />
                    </div>
                  </>
                )}
                {sendingMedia && <div className="spinner spinner-brand" />}
              </div>
              {sendingMessage && <div className="spinner spinner-brand" />}
              <div className="send-button-div">
                <button
                  type="button"
                  className={`icon-btn send-btn ${isSendEnabled ? 'enabled' : 'disabled'}`}
                  onClick={handleSend}
                  disabled={!isSendEnabled}
                  title="Enviar"
                  aria-label="Enviar"
                >
                  <Send size={22} />
                </button>
              </div>
              <AudioRecorder threadId={threadId} onReloadMessages={loadMessages} />
            </div>
            {!sendingMessage && (
              <div className="actions-row">
                <WhatsAppMediaInput threadId={threadId} onMediaSent={loadMessages} />
                {conversationInProgress && (
                  <button
                    type="button"
                    className="btn btn-neutral btn-send-template"
                    onClick={() => setShowTemplateModal(true)}
                    disabled={sendingMessage}
                  >
                    Enviar template
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="warning-banner" role="status">
            <TriangleAlert size={16} />
            <div>
              <p>
                <strong>Atenção:</strong>
              </p>
              {!hasInProgressConversation && (
                <p>
                  Essa conversa de WhatsApp foi encerrada.
                  <br />
                  Crie um novo caso de contato e inicie uma nova conversa utilizando os
                  templates.
                </p>
              )}
              {hasInProgressConversation && !userAllowedToSendMessage && (
                <p>Apenas o proprietário da conversa pode enviar mensagens.</p>
              )}
              {hasInProgressConversation &&
                userAllowedToSendMessage &&
                shouldUseTemplates && (
                  <p>
                    A última mensagem que este cliente nos enviou foi
                    <strong> há mais de 24 horas.</strong>
                    <br />
                    Para continuar a conversa,
                    <strong> envie somente uma mensagem</strong> (usando um de nossos
                    templates de Whatsapp) e aguarde a resposta do cliente.
                  </p>
                )}
            </div>
          </div>
        )}

        {userAllowedToSendMessage && shouldUseTemplates && conversationInProgress && (
          <button
            type="button"
            className="btn btn-neutral btn-send-template btn-send-template--standalone"
            onClick={() => setShowTemplateModal(true)}
          >
            Enviar template
          </button>
        )}

        {showTemplateModal && (
          <>
            <div
              className="modal-backdrop"
              role="presentation"
              onClick={() => setShowTemplateModal(false)}
            />
            <section className="modal modal--template" role="dialog" aria-modal>
              <div className="modal__container">
                <header className="modal__header">
                  <button
                    type="button"
                    className="modal__close"
                    onClick={() => setShowTemplateModal(false)}
                    aria-label="Fechar"
                  >
                    <X size={18} />
                  </button>
                  <h1>Enviar mensagem de WhatsApp</h1>
                </header>
                <WhatsAppOutbound
                  threadId={threadId}
                  onClose={() => setShowTemplateModal(false)}
                  onReloadMessages={loadMessages}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
