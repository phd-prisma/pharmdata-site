import "server-only";
import { schemaTypes } from "@/sanity/schemas";
import type { ArrayItemSpec, DocumentSpec, FieldSpec, FieldsetSpec } from "./types";

// Ajustes só do painel, por caminho do campo
const SOFT_LIMITS: Record<string, number> = {
  "siteSettings.siteTitle": 60,
  "siteSettings.description": 160,
};
const EMPHASIS = new Set(["homePage.hero.title"]);

/* eslint-disable @typescript-eslint/no-explicit-any */
type SchemaDef = Record<string, any>;

const namedTypes = new Map<string, SchemaDef>(
  (schemaTypes as SchemaDef[]).map((type) => [type.name, type]),
);

// Descobre se o campo é obrigatório executando a validação com uma regra falsa
function isRequired(validation: unknown): boolean {
  if (typeof validation !== "function") return false;
  let required = false;
  const rule: any = new Proxy(
    {},
    {
      get: (_target, prop) => () => {
        if (prop === "required") required = true;
        return rule;
      },
    },
  );
  try {
    validation(rule);
  } catch {
    // validações mais complexas são ignoradas
  }
  return required;
}

function toFieldsets(fieldsets: SchemaDef[] | undefined): FieldsetSpec[] {
  return (fieldsets ?? []).map((fieldset) => ({
    name: fieldset.name,
    title: fieldset.title,
    description: fieldset.description,
    columns: fieldset.options?.columns,
    collapsed: fieldset.options?.collapsed,
  }));
}

function toArrayItem(member: SchemaDef): ArrayItemSpec {
  const named = namedTypes.get(member.type);
  const def = named ?? member;
  return {
    typeName: named ? named.name : member.name,
    title: def.title ?? def.name,
    fields: (def.fields ?? []).map((field: SchemaDef) => toField(field, "")),
    previewTitle: def.preview?.select?.title,
    previewSubtitle: def.preview?.select?.subtitle,
  };
}

function toField(field: SchemaDef, parentPath: string): FieldSpec {
  const path = parentPath ? `${parentPath}.${field.name}` : field.name;
  const base = {
    name: field.name,
    title: field.title ?? field.name,
    description: typeof field.description === "string" ? field.description : undefined,
    required: isRequired(field.validation),
    group: field.group,
    fieldset: field.fieldset,
    softLimit: SOFT_LIMITS[path],
    emphasis: EMPHASIS.has(path) || undefined,
  };

  const named = namedTypes.get(field.type);
  if (named && named.type === "object") {
    return {
      ...base,
      kind: "object",
      typeName: named.name,
      fields: named.fields.map((sub: SchemaDef) => toField(sub, path)),
      fieldsets: toFieldsets(named.fieldsets),
    };
  }

  switch (field.type) {
    case "text":
      return { ...base, kind: "text", rows: field.rows ?? 3 };
    case "url":
      return { ...base, kind: "url" };
    case "number":
      return { ...base, kind: "number" };
    case "image":
      return {
        ...base,
        kind: "image",
        hotspot: Boolean(field.options?.hotspot),
        fields: (field.fields ?? []).map((sub: SchemaDef) => toField(sub, path)),
      };
    case "file":
      return { ...base, kind: "file", accept: field.options?.accept };
    case "object":
      return {
        ...base,
        kind: "object",
        fields: field.fields.map((sub: SchemaDef) => toField(sub, path)),
        fieldsets: toFieldsets(field.fieldsets),
      };
    case "array":
      return { ...base, kind: "array", of: toArrayItem(field.of[0]) };
    case "string":
    default:
      if (field.options?.list) {
        return { ...base, kind: "select", options: field.options.list };
      }
      return { ...base, kind: "string" };
  }
}

export function getDocumentSpec(type: string): DocumentSpec {
  const def = namedTypes.get(type);
  if (!def) throw new Error(`Tipo desconhecido: ${type}`);
  return {
    type,
    title: def.title,
    groups: (def.groups ?? []).map((group: SchemaDef) => ({
      name: group.name,
      title: group.title,
    })),
    fieldsets: toFieldsets(def.fieldsets),
    fields: def.fields.map((field: SchemaDef) => toField(field, type)),
  };
}
