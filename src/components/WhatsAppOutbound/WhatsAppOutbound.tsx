import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText, Pencil } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import { extractTemplateParams } from '../../utils/messageUtils';
import { AdvancedPicklist } from '../AdvancedPicklist/AdvancedPicklist';
import type { TemplateParam } from '../../types/template';
import './WhatsAppOutbound.css';

interface WhatsAppOutboundProps {
  threadId: string;
  onClose?: () => void;
  onReloadMessages?: () => void;
}

export function WhatsAppOutbound({
  threadId,
  onClose,
  onReloadMessages,
}: WhatsAppOutboundProps) {
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [templateId, setTemplateId] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');
  const [paramValues, setParamValues] = useState<TemplateParam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [templatesLoadedAt] = useState(() => Date.now());

  const canSendTemplate = useMemo(() => {
    return Object.keys(templates).length > 0 && !loadError;
  }, [templates, loadError]);

  useEffect(() => {
    chatApi
      .getTemplates(threadId)
      .then(setTemplates)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [threadId]);

  const templateOptions = useMemo(
    () => Object.keys(templates).map((name) => ({ label: name, value: name })),
    [templates],
  );

  const handleTemplateChange = async (value: string) => {
    if (!templates[value]) return;
    setTemplateId(value);
    const body = templates[value];
    setOriginalMessage(body);
    setTemplateMessage(body);
    const keys = extractTemplateParams(body);
    setParamValues(
      keys.map((key) => ({
        key,
        value: '',
        label: key,
        placeholder: `Digite o parâmetro ${key.slice(2, -2)}`,
        order: key.slice(2, -2),
      })),
    );

    try {
      const variables = await chatApi.getTemplateVariables(value, threadId);
      setParamValues((prev) =>
        prev.map((p) => {
          const v = variables[p.key];
          if (!v) return p;
          return {
            ...p,
            value: v.fieldValue,
            label: v.fieldLabel,
            placeholder: `Digite o ${v.fieldLabel}`,
          };
        }),
      );
      let msg = body;
      Object.entries(variables).forEach(([key, v]) => {
        if (v.fieldValue) msg = msg.replace(key, v.fieldValue);
      });
      setTemplateMessage(msg);
    } catch {
      /* optional pre-fill */
    }
  };

  const handleParamChange = (key: string, value: string) => {
    setParamValues((prev) => {
      const next = prev.map((p) => (p.key === key ? { ...p, value } : p));
      let msg = originalMessage;
      next.forEach((p) => {
        if (p.value) msg = msg.replace(p.key, p.value);
      });
      setTemplateMessage(msg);
      return next;
    });
  };

  const remainingPlaceholders = extractTemplateParams(templateMessage);
  const totalParams = extractTemplateParams(originalMessage).length;
  const filledParams = totalParams - remainingPlaceholders.length;

  const disableSend =
    sendingMessage ||
    !templateId ||
    remainingPlaceholders.length > 0;

  const sendAction = async () => {
    setSendingMessage(true);
    let message = templates[templateId];
    paramValues.forEach((p) => {
      message = message.replace(p.key, p.value);
    });
    const spentSeconds = Math.abs(Date.now() - templatesLoadedAt) / 1000;
    try {
      const ok = await chatApi.sendMessageWithTemplate(
        threadId,
        templateId,
        message,
        spentSeconds,
      );
      if (ok) {
        onReloadMessages?.();
        onClose?.();
      } else {
        alert('Erro ao enviar a mensagem.');
      }
    } catch (e) {
      alert(
        `Erro ao enviar a mensagem com o template ${templateId}: ${
          e instanceof Error ? e.message : ''
        }`,
      );
    } finally {
      setSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="outbound-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="whatsapp-outbound">
      {!canSendTemplate && (
        <div className="alert alert-warning" role="alert">
          <AlertTriangle size={20} />
          {loadError ? (
            <p>Erro ao carregar templates do WhatsApp. Por favor, tente novamente.</p>
          ) : (
            <p>Não há nenhum template aprovado do WhatsApp disponível para uso.</p>
          )}
        </div>
      )}

      {canSendTemplate && (
        <div className="outbound-body">
          <AdvancedPicklist
            fieldLabel="Templates"
            placeholder="Selecione um template"
            options={templateOptions}
            value={templateId}
            onChange={({ value }) => handleTemplateChange(value)}
          />

          {templateId && (
            <div className="grid-params-template">
              {paramValues.length > 0 && (
                <article className="card col-params">
                  <header>
                    <Pencil size={18} />
                    <h3>
                      Parâmetros ({filledParams}/{totalParams})
                    </h3>
                  </header>
                  <div className="card__body">
                    {paramValues.map((param) => (
                      <div className="form-group" key={param.key}>
                        <label>
                          <strong>
                            {param.order}. {param.label}
                          </strong>
                        </label>
                        <input
                          type="text"
                          placeholder={param.placeholder}
                          value={param.value}
                          onChange={(e) => handleParamChange(param.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </article>
              )}
              <article className="card col-template">
                <header>
                  <FileText size={18} />
                  <h3>Template</h3>
                </header>
                <div className="card__body">
                  <div className="template-preview chat-message__text_inbound">
                    <span>{templateMessage}</span>
                  </div>
                </div>
              </article>
            </div>
          )}
        </div>
      )}

      <footer className="outbound-footer">
        <button type="button" className="btn btn-neutral" onClick={onClose}>
          Cancelar
        </button>
        {canSendTemplate && (
          <button
            type="button"
            className="btn btn-brand"
            disabled={disableSend}
            onClick={sendAction}
          >
            Enviar
          </button>
        )}
      </footer>
    </div>
  );
}
