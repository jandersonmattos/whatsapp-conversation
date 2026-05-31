export interface ConversationApiResponse {
  Id: string;
  Status__c: 'In Progress' | 'Closed';
  Phone__c: string;
  LoftPhone__c: string;
  LastMessage__c: string;
  ClientName: string;
  OwnerId__c?: string;
}

export interface TwilioMessageApi {
  body: string;
  num_media: string;
  date_sent: string;
  date_created: string;
  date_updated: string;
  status: string;
  direction: string;
  sid: string;
  account_sid: string;
  from: string;
  to: string;
  messaging_service_sid?: string;
  num_segments: string;
  subresource_uris?: {
    media: string;
  };
}

export interface TwilioMessagesApiResponse {
  first_page_uri: string;
  next_page_uri: string | null;
  page: number;
  page_size: number;
  uri: string;
  messages: TwilioMessageApi[];
}
