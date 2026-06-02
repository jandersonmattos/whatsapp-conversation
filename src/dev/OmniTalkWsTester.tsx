import { useCallback, useEffect, useRef, useState } from 'react';
import { REALTIME_WS_URL } from '../api/config';
import {
  omniTalkWsClient,
  type OmniTalkInboundPayload,
} from '../services/realtime/omniTalkWsClient';
import { buildOmniTalkChannel, OMNITALK_EVENT_INBOUND } from '../utils/channelUtils';
import { MOCK_CURRENT_USER_ID } from '../mocks/mockData';
import { resolveEmbedConfig } from '../utils/embedUtils';
import './OmniTalkWsTester.css';

const embed = resolveEmbedConfig();
const defaultOwnerId = embed.currentUserId || MOCK_CURRENT_USER_ID;

interface LogEntry {
  id: number;
  at: string;
  kind: 'info' | 'inbound' | 'error';
  text: string;
}

const SIMULATOR_URL = 'http://localhost:3001/simulator';

export function OmniTalkWsTester() {
  const [wsUrl, setWsUrl] = useState(REALTIME_WS_URL);
  const [ownerId, setOwnerId] = useState(defaultOwnerId);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastPayload, setLastPayload] = useState<OmniTalkInboundPayload | null>(null);
  const logId = useRef(0);

  const appendLog = useCallback((kind: LogEntry['kind'], text: string) => {
    logId.current += 1;
    setLogs((prev) => [
      {
        id: logId.current,
        at: new Date().toLocaleTimeString('pt-BR'),
        kind,
        text,
      },
      ...prev.slice(0, 99),
    ]);
  }, []);

  const handleConnect = () => {
    if (!ownerId.trim()) {
      appendLog('error', 'Informe o Owner ID (ex.: user-agent-001)');
      return;
    }

    omniTalkWsClient.connect({
      wsUrl: wsUrl.trim(),
      ownerId: ownerId.trim(),
      handlers: {
        onLog: (msg) => appendLog('info', msg),
        onConnectionChange: setConnected,
        onInbound: (payload) => {
          setLastPayload(payload);
          const count = payload.notifications?.length ?? 0;
          const threadIds = payload.notifications
            ?.map((n) => n.threadId)
            .filter(Boolean)
            .join(', ');
          appendLog(
            'inbound',
            `${OMNITALK_EVENT_INBOUND}: ${count} notificação(ões) threadId=[${threadIds}] — ${payload.timestamp}`,
          );
        },
        onError: (msg) => appendLog('error', msg),
      },
    });
  };

  const handleDisconnect = () => {
    omniTalkWsClient.disconnect();
    setConnected(false);
    appendLog('info', 'Desconectado manualmente');
  };

  useEffect(() => {
    return () => omniTalkWsClient.disconnect();
  }, []);

  const channel = buildOmniTalkChannel(ownerId.trim() || MOCK_CURRENT_USER_ID);

  return (
    <div className="omnitalk-tester">
      <header className="omnitalk-tester__header">
        <div>
          <h1>Cliente WebSocket — OmniTalk</h1>
          <p>
            Testa o canal <code>{channel}</code> e o evento{' '}
            <code>{OMNITALK_EVENT_INBOUND}</code> (somente inbound do cliente).
          </p>
        </div>
        <a className="omnitalk-tester__link" href="/">
          ← Voltar ao chat
        </a>
      </header>

      <section className="omnitalk-tester__panel">
        <label>
          URL WebSocket
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            spellCheck={false}
          />
        </label>

        <label>
          Owner ID (agente)
          <input
            type="text"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            placeholder="user-agent-001"
          />
        </label>

        <p className="omnitalk-tester__hint">
          Deve ser o mesmo <code>OwnerId__c</code> da conversa no mock da API (
          <code>user-agent-001</code> no thread demo).
        </p>

        <div className="omnitalk-tester__actions">
          <button
            type="button"
            className="omnitalk-tester__btn omnitalk-tester__btn--primary"
            onClick={handleConnect}
            disabled={connected}
          >
            Conectar
          </button>
          <button
            type="button"
            className="omnitalk-tester__btn"
            onClick={handleDisconnect}
            disabled={!connected}
          >
            Desconectar
          </button>
          <span
            className={`omnitalk-tester__status ${connected ? 'omnitalk-tester__status--on' : ''}`}
          >
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        <p className="omnitalk-tester__hint">
          Publique inbound em{' '}
          <a href={SIMULATOR_URL} target="_blank" rel="noreferrer">
            {SIMULATOR_URL}
          </a>{' '}
          (direção &quot;Inbound&quot;).
        </p>
      </section>

      <div className="omnitalk-tester__grid">
        <section className="omnitalk-tester__panel">
          <h2>Log</h2>
          <ul className="omnitalk-tester__log">
            {logs.length === 0 ? (
              <li className="omnitalk-tester__log-empty">Nenhum evento ainda.</li>
            ) : (
              logs.map((entry) => (
                <li key={entry.id} className={`omnitalk-tester__log-item--${entry.kind}`}>
                  <time>{entry.at}</time> {entry.text}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="omnitalk-tester__panel">
          <h2>Último payload ({OMNITALK_EVENT_INBOUND})</h2>
          <pre className="omnitalk-tester__json">
            {lastPayload
              ? JSON.stringify(lastPayload, null, 2)
              : 'Aguardando mensagem inbound…'}
          </pre>
        </section>
      </div>
    </div>
  );
}
