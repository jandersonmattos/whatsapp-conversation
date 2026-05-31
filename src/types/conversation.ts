export type ConversationStatus = 'In Progress' | 'Closed';

export interface Conversation {
  id: string;
  status: ConversationStatus;
  phone: string;
  loftPhone?: string;
  read: boolean;
  customerName: string;
  ownerId: string;
  /** Set client-side from Salesforce embed context */
  currentUserId?: string;
  /** Computed client-side: ownerId === currentUserId */
  isOwner?: boolean;
}
