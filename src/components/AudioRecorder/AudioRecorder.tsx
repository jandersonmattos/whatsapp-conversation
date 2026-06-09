import { useCallback, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import './AudioRecorder.css';

const TIME_LIMIT_SECONDS = 300;
const MIME_TYPE = 'audio/ogg';

interface AudioRecorderProps {
  threadId: string;
  onReloadMessages?: () => void;
  disabled?: boolean;
}

export function AudioRecorder({
  threadId,
  onReloadMessages,
  disabled,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [timePassed, setTimePassed] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimePassed(null);
  }, []);

  const startTimer = useCallback(() => {
    let passed = 0;
    setTimePassed(0);
    timerRef.current = setInterval(() => {
      passed += 1;
      setTimePassed(passed);
      if (passed >= TIME_LIMIT_SECONDS) {
        mediaRecorderRef.current?.stop();
      }
    }, 1000);
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        stopTimer();
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, { type: MIME_TYPE });
        const url = URL.createObjectURL(blob);
        const b64 = await blobToBase64(blob);
        setAudioUrl(url);
        setBase64Data(b64);
        setShowConfirmModal(true);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      startTimer();
    } catch {
      alert('Não foi possível acessar o microfone.');
    }
  }, [startTimer, stopTimer]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const toggleRecording = () => {
    if (disabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const discard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setBase64Data(null);
    setShowConfirmModal(false);
  };

  const sendAudio = async () => {
    if (!base64Data || !threadId) return;
    setIsSending(true);
    try {
      const contentVersionId = await chatApi.uploadFile(
        threadId,
        base64Data,
        '-AUDIO.ogg',
        MIME_TYPE,
      );
      const mediaUrl = await chatApi.getMediaUrl(contentVersionId);
      await chatApi.sendMediaMessage(threadId, mediaUrl);
      discard();
      onReloadMessages?.();
    } catch {
      alert('Erro ao enviar áudio.');
    } finally {
      setIsSending(false);
    }
  };

  const formattedTime =
    timePassed !== null && !showConfirmModal
      ? `${Math.floor(timePassed / 60)}:${String(timePassed % 60).padStart(2, '0')}`
      : '';

  return (
    <>
      {showConfirmModal && (
        <div className="modal-overlay" role="presentation">
          <div className="modal" role="dialog" aria-modal aria-labelledby="audio-modal-title">
            <header className="modal__header">
              <h2 id="audio-modal-title">Confirmar Envio</h2>
            </header>
            <div className="modal__content modal__content--center">
              {isSending && <div className="spinner" />}
              {audioUrl && (
                <audio controls src={audioUrl}>
                  <track kind="captions" />
                </audio>
              )}
            </div>
            <footer className="modal__footer">
              <button type="button" className="btn btn-neutral" onClick={discard}>
                Descartar
              </button>
              <button
                type="button"
                className="btn btn-brand"
                disabled={isSending || !base64Data}
                onClick={sendAudio}
              >
                Enviar
              </button>
            </footer>
          </div>
        </div>
      )}
      <div className="rec-button-container">
        <button
          type="button"
          className={`icon-btn rec-button ${isRecording ? 'rec-button--stop' : ''}`}
          onClick={toggleRecording}
          disabled={disabled}
          title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
          aria-label={isRecording ? 'Parar gravação' : 'Gravar áudio'}
        >
          {isRecording ? <Square size={22} /> : <Mic size={22} />}
        </button>
        {formattedTime && <label>{formattedTime}</label>}
      </div>
    </>
  );
}
