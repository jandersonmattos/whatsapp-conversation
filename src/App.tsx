import { useEffect } from 'react';
import { setAuthToken } from './api/auth';
import { resolveEmbedConfig } from './utils/embedUtils';
import { EmbedProvider } from './context/EmbedContext';
import { WhatsAppChat } from './components/WhatsAppChat/WhatsAppChat';
import {
  DEFAULT_THREAD_ID,
  MOCK_CURRENT_USER_ID,
} from './mocks/mockData';
import './index.css';

const embed = resolveEmbedConfig();

const threadId = embed.threadId || DEFAULT_THREAD_ID;
const currentUserId = embed.currentUserId || MOCK_CURRENT_USER_ID;

function App() {
  useEffect(() => {
    setAuthToken(embed.authToken);
  }, []);

  useEffect(() => {
    const isEmbedded = window.self !== window.top;
    document.documentElement.classList.toggle('embedded', isEmbedded);
  }, []);

  return (
    <EmbedProvider
      value={{
        threadId,
        currentUserId,
        authToken: embed.authToken,
        caseStatus: embed.caseStatus,
      }}
    >
      <div className="app-shell">
        <WhatsAppChat
          threadId={threadId}
          currentUserId={currentUserId}
          authToken={embed.authToken}
        />
      </div>
    </EmbedProvider>
  );
}

export default App;
