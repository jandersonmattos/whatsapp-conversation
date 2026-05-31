# WhatsApp Conversation (Agent UI)

React chat UI embedded in Salesforce. Data comes from **whatsapp-conversation-api** (external service), not from Salesforce Apex.

## Stack

- React 19 + TypeScript + Vite

## Getting started

**1. Start the mock API** (sibling project):

```bash
cd ../whatsapp-conversation-api
npm install
npm run dev
```

**2. Start the frontend:**

```bash
npm install
npm run dev
```

**3. Open with threadId:**

```
http://localhost:5173/?threadId=thread-demo-001&userId=user-agent-001
```

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL (`http://localhost:3001/api`) |
| `VITE_USE_MOCK_DATA` | `true` = frontend in-memory mocks; `false` = call API |

## URL parameters

| Param | Description |
|-------|-------------|
| `threadId` | Conversation thread id (same as Salesforce `recordId`) |
| `userId` | Current agent id (for owner permission check) |
| `authToken` | Optional Bearer token |

Salesforce embed:

```html
<script>
  window.__WHATSAPP_CHAT_EMBED__ = {
    threadId: 'a0XXXXXXXXXXXXXXX',
    currentUserId: '005XXXXXXXXXXXX',
    authToken: 'optional',
  };
</script>
```

## API consumed (whatsapp-conversation-api)

| Method | Path | Maps to |
|--------|------|---------|
| GET | `/api/threads/:threadId/conversation` | Header (name, phone, status) |
| GET | `/api/threads/:threadId/messages` | Twilio message list → chat bubbles |

## Pusher simulator (tempo real)

O frontend conecta ao WebSocket **após carregar a conversa** (precisa de `Phone__c` + `LoftPhone__c`), no mesmo canal do Salesforce:

```
whatsapp-twilio-{telefoneCliente}-{telefoneLoft}
```

Eventos:
- `message-inbound-received` — mensagem do cliente (igual Pusher real)
- `message-outbound-received` — apenas no simulador de dev

**Testar:**

1. API rodando → abra http://localhost:3001/simulator
2. Frontend → http://localhost:5173/?threadId=thread-demo-001&userId=user-agent-001
3. Bolinha verde no header = WebSocket conectado
4. Publique mensagem inbound/outbound no simulador → aparece na hora no chat

Para desligar tempo real: `VITE_REALTIME_ENABLED=false`
