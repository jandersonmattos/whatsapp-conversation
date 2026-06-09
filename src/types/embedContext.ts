export interface EmbedConfig {
  threadId: string;
  currentUserId: string;
  authToken?: string;
  /** Salesforce Case status from URL embed (e.g. Closed) */
  caseStatus?: string;
}

declare global {
  interface Window {
    /** Injected by Salesforce LWC before the React bundle loads */
    __WHATSAPP_CHAT_EMBED__?: EmbedConfig;
  }
}

export {};
