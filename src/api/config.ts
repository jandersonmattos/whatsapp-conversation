export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

export const USE_MOCK_DATA =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false';

/** External messaging service WebSocket (not Salesforce) */
export const REALTIME_WS_URL =
  import.meta.env.VITE_REALTIME_WS_URL ?? 'ws://localhost:3001/ws';

export const REALTIME_ENABLED =
  import.meta.env.VITE_REALTIME_ENABLED !== 'false';
