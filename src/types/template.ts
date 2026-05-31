export interface WhatsAppTemplate {
  id: string;
  name: string;
  body: string;
}

export interface TemplateParam {
  key: string;
  value: string;
  label: string;
  placeholder: string;
  order: string;
}

export interface TemplateVariable {
  fieldValue: string;
  fieldLabel: string;
}
