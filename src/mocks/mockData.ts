import type { ChatMessage } from '../types/message';
import type { Conversation } from '../types/conversation';
import type { WhatsAppTemplate } from '../types/template';

export const DEFAULT_THREAD_ID = 'thread-demo-001';
export const MOCK_CONVERSATION_ID = DEFAULT_THREAD_ID;
export const MOCK_CURRENT_USER_ID = 'user-agent-001';
export const MOCK_OTHER_USER_ID = 'user-agent-002';

export const mockConversation: Omit<Conversation, 'currentUserId' | 'isOwner'> = {
  id: MOCK_CONVERSATION_ID,
  status: 'In Progress',
  phone: '+5511999887766',
  loftPhone: '+551140000000',
  read: false,
  customerName: 'Maria Silva',
  ownerId: MOCK_CURRENT_USER_ID,
};

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const conversationScript: { direction: 'inbound' | 'outbound'; body: string }[] = [
  { direction: 'inbound', body: 'Olá, preciso de ajuda com meu contrato.' },
  { direction: 'outbound', body: 'Olá Maria! Claro, em que posso ajudar?' },
  { direction: 'inbound', body: 'Gostaria de saber o valor da próxima parcela.' },
  { direction: 'outbound', body: 'Vou verificar para você. Um momento, por favor.' },
  {
    direction: 'outbound',
    body: 'Encontrei aqui: a próxima parcela é de R$ 1.245,00 com vencimento no dia 10.',
  },
  { direction: 'inbound', body: 'Certo, e consigo antecipar o pagamento?' },
  {
    direction: 'outbound',
    body: 'Sim! Você pode antecipar pelo app ou solicitar o boleto antecipado por aqui mesmo.',
  },
  { direction: 'inbound', body: 'Pode me enviar o boleto antecipado então?' },
  {
    direction: 'outbound',
    body: 'Claro, estou gerando o boleto agora. Assim que ficar pronto te envio por aqui.',
  },
  { direction: 'inbound', body: 'Perfeito, fico no aguardo.' },
  { direction: 'outbound', body: 'Boleto gerado! O vencimento continua sendo dia 10, ok?' },
  { direction: 'inbound', body: 'Sim, pode enviar.' },
  {
    direction: 'outbound',
    body: 'Acabei de enviar o PDF do boleto. Confirma se recebeu, por favor?',
  },
  { direction: 'inbound', body: 'Recebi sim, obrigada!' },
  { direction: 'inbound', body: 'Só mais uma dúvida: o contrato tem seguro incluso?' },
  {
    direction: 'outbound',
    body: 'Sim, seu contrato inclui seguro residencial básico. Quer que eu detalhe a cobertura?',
  },
  { direction: 'inbound', body: 'Sim, por favor.' },
  {
    direction: 'outbound',
    body: 'A cobertura inclui incêndio, roubo de bens dentro do imóvel e danos elétricos até o limite da apólice.',
  },
  { direction: 'inbound', body: 'Entendi. E como faço para acionar em caso de sinistro?' },
  {
    direction: 'outbound',
    body: 'Você pode acionar pela central 0800 ou pelo app, na área "Seguro do contrato".',
  },
  { direction: 'inbound', body: 'Ótimo, anotei aqui.' },
  { direction: 'outbound', body: 'Posso ajudar com mais alguma coisa hoje?' },
  { direction: 'inbound', body: 'Queria saber se consigo alterar a data de vencimento.' },
  {
    direction: 'outbound',
    body: 'A alteração de vencimento pode ser feita uma vez a cada 12 meses. Quer que eu verifique se você já usou essa opção?',
  },
  { direction: 'inbound', body: 'Sim, verifica por favor.' },
  {
    direction: 'outbound',
    body: 'Verifiquei: você ainda não alterou a data este ano. Posso registrar a solicitação agora.',
  },
  { direction: 'inbound', body: 'Quero mudar para dia 15.' },
  {
    direction: 'outbound',
    body: 'Solicitação registrada! A mudança entra em vigor a partir da próxima fatura.',
  },
  { direction: 'inbound', body: 'Maravilha, muito obrigada pelo atendimento!' },
  {
    direction: 'outbound',
    body: 'Por nada, Maria! Qualquer dúvida estamos à disposição. Tenha um ótimo dia!',
  },
  { direction: 'inbound', body: 'Obrigada!' },
];

export const mockMessages: ChatMessage[] = conversationScript.map((entry, index) => {
  const total = conversationScript.length;
  const hoursFromStart = (total - index) * 0.15;

  return {
    twilioId: `msg-${String(index + 1).padStart(3, '0')}`,
    direction: entry.direction,
    timestamp: hoursAgo(hoursFromStart),
    status:
      entry.direction === 'outbound'
        ? index === total - 1
          ? 'delivered'
          : 'read'
        : index === total - 1
          ? 'received'
          : 'read',
    isMedia: false,
    body: entry.body,
  };
});

export const mockTemplates: WhatsAppTemplate[] = [
  {
    id: 'welcome_followup',
    name: 'welcome_followup',
    body: 'Olá {{1}}, tudo bem? Estamos entrando em contato sobre o seu caso {{2}}.',
  },
  {
    id: 'payment_reminder',
    name: 'payment_reminder',
    body: 'Olá {{1}}, lembramos que sua parcela vence em {{2}}. Posso ajudar com algo?',
  },
];
