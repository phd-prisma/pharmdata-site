// Descrição serializável dos formulários do painel, gerada a partir dos schemas do Sanity

export type FieldKind =
  | "string"
  | "text"
  | "url"
  | "number"
  | "select"
  | "image"
  | "file"
  | "object"
  | "array";

export interface FieldsetSpec {
  name: string;
  title?: string;
  description?: string;
  columns?: number;
  collapsed?: boolean;
}

export interface FieldSpec {
  name: string;
  title: string;
  kind: FieldKind;
  description?: string;
  required?: boolean;
  group?: string;
  fieldset?: string;
  rows?: number;
  accept?: string;
  hotspot?: boolean;
  options?: { title: string; value: string }[];
  // Limite sugerido (ex.: SEO), exibido como contador
  softLimit?: number;
  // Campo de destaque (ex.: título principal), com fonte maior
  emphasis?: boolean;
  // object e image: subcampos
  typeName?: string;
  fields?: FieldSpec[];
  fieldsets?: FieldsetSpec[];
  // array: tipo dos itens
  of?: ArrayItemSpec;
}

export interface ArrayItemSpec {
  typeName: string;
  title: string;
  fields: FieldSpec[];
  previewTitle?: string;
  previewSubtitle?: string;
}

export interface DocumentSpec {
  type: string;
  title: string;
  groups: { name: string; title: string }[];
  fieldsets: FieldsetSpec[];
  fields: FieldSpec[];
}

export type DocStatus = "published" | "draft" | "new";

export interface EditableDocument {
  id: string;
  type: string;
  status: DocStatus;
  updatedAt?: string;
  values: Record<string, unknown>;
}

export interface CollectionItem {
  id: string;
  title: string;
  subtitle?: string;
  imageRef?: string;
  status: DocStatus;
  order?: number;
}
