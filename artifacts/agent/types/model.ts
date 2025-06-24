export interface AgentModel {
  id: string;
  name: string;
  emoji?: string; // AI-generated emoji representing the model
  description?: string; // AI-generated description for preview
  hasPublishedField?: boolean; // Whether this model has a published field
  idField: string;
  displayFields: string[];
  fields: AgentField[];
  enums: AgentEnum[];
  forms?: AgentForm[]; // Forms for grouping fields during create/update
  records?: ModelRecord[]; // Store actual data records
  exampleRecords?: ModelRecord[]; // Store example data records
}

export interface ModelRecord {
  id: string;
  modelId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentField {
  id: string;
  name: string;
  type: string;
  isId: boolean;
  unique: boolean;
  list: boolean;
  required: boolean;
  kind: 'scalar' | 'object' | 'enum';
  relationField: boolean;
  title: string;
  sort: boolean;
  order: number;
  defaultValue?: string;
}

export interface AgentEnum {
  id: string;
  name: string;
  fields: AgentEnumField[];
}

export interface AgentEnumField {
  id: string;
  name: string;
  type: string;
  defaultValue?: string;
}

export interface AgentForm {
  id: string;
  name: string;
  title: string;
  description?: string;
  fields: AgentFormField[];
  order: number;
}

export interface AgentFormField {
  id: string;
  fieldId: string; // Reference to AgentField.id
  required?: boolean; // Override field's required setting for this form
  hidden?: boolean; // Hide field in this form
  order: number;
} 