import {
  BarChartIcon,
  BulbOutlineIcon,
  CaseIcon,
  EnvelopeIcon,
  HomeIcon,
  RocketIcon,
  StarIcon,
  UsersIcon,
  WarningOutlineIcon,
} from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "@sanity/types";

const text = (name: string, title: string, rows?: number) =>
  defineField(
    rows
      ? { name, title, type: "text", rows }
      : { name, title, type: "string" },
  );

export const homePage = defineType({
  name: "homePage",
  title: "Página Inicial",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "hero", title: "Hero", icon: RocketIcon, default: true },
    { name: "stats", title: "Números", icon: BarChartIcon },
    { name: "problem", title: "Problema", icon: WarningOutlineIcon },
    { name: "solution", title: "Solução", icon: BulbOutlineIcon },
    { name: "differentials", title: "Diferenciais", icon: StarIcon },
    { name: "team", title: "Quem somos", icon: UsersIcon },
    { name: "clients", title: "Clientes", icon: CaseIcon },
    { name: "contact", title: "Contato", icon: EnvelopeIcon },
  ],
  fields: [
    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      group: "hero",
      fieldsets: [
        { name: "ctas", title: "Botões", options: { columns: 2 } },
        { name: "card", title: "Card de exemplo", options: { columns: 2 } },
      ],
      fields: [
        text("eyebrow", "Chamada acima do título"),
        text("title", "Título", 2),
        text("text", "Texto", 3),
        defineField({ name: "primaryCta", title: "Principal", type: "link", fieldset: "ctas" }),
        defineField({ name: "secondaryCta", title: "Secundário", type: "link", fieldset: "ctas" }),
        { ...text("recordLabel", "Rótulo (ex.: REGISTRO · EXEMPLO)"), fieldset: "card" },
        { ...text("recordStatus", "Status (ex.: CURADO)"), fieldset: "card" },
        defineField({
          name: "records",
          title: "Registros de exemplo",
          description: "Alternam no card a cada 4,2 segundos",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "record",
              fields: [
                text("name", "Nome do medicamento"),
                text("form", "Apresentação"),
                defineField({
                  name: "fields",
                  title: "Campos",
                  type: "array",
                  of: [
                    defineArrayMember({
                      type: "object",
                      name: "recordField",
                      fields: [text("label", "Campo"), text("value", "Valor")],
                      preview: { select: { title: "label", subtitle: "value" } },
                    }),
                  ],
                }),
              ],
              preview: { select: { title: "name", subtitle: "form" } },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "stats",
      title: "Números",
      type: "array",
      group: "stats",
      of: [
        defineArrayMember({
          type: "object",
          name: "stat",
          icon: BarChartIcon,
          fields: [text("value", "Valor"), text("label", "Descrição")],
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
    }),
    defineField({
      name: "problem",
      title: "Problema",
      type: "object",
      group: "problem",
      fields: [
        text("eyebrow", "Chamada acima do título"),
        text("title", "Título", 2),
        text("lead", "Texto de apoio", 3),
        text("impactLabel", "Rótulo do impacto"),
        defineField({
          name: "items",
          title: "Problemas",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "problemItem",
              fields: [
                text("title", "Título"),
                text("description", "Descrição", 3),
                text("impact", "Impacto no negócio", 3),
              ],
              preview: { select: { title: "title", subtitle: "description" } },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "solution",
      title: "Solução",
      type: "object",
      group: "solution",
      fields: [
        text("eyebrow", "Chamada acima do título"),
        text("title", "Título", 2),
        text("lead", "Texto de apoio", 3),
        defineField({
          name: "steps",
          title: "Etapas",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "step",
              fields: [
                text("stage", "Etapa (ex.: ETAPA 01)"),
                text("tag", "Tag (ex.: HARMONIZAÇÃO)"),
                text("title", "Título"),
                text("description", "Descrição", 3),
                text("output", "Resultado da etapa", 2),
              ],
              preview: { select: { title: "title", subtitle: "stage" } },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "differentials",
      title: "Diferenciais",
      type: "object",
      group: "differentials",
      fields: [
        text("eyebrow", "Chamada acima do título"),
        text("title", "Título"),
        defineField({
          name: "items",
          title: "Diferenciais",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "differentialItem",
              fields: [text("title", "Título"), text("description", "Descrição", 3)],
              preview: { select: { title: "title", subtitle: "description" } },
            }),
          ],
        }),
        text("resultLabel", "Rótulo do resultado (em itálico)"),
        text("resultText", "Texto do resultado", 2),
      ],
    }),
    defineField({
      name: "team",
      title: "Quem somos",
      description: "Os membros são cadastrados em “Membros da Equipe”",
      type: "object",
      group: "team",
      fields: [
        text("eyebrow", "Chamada acima do título"),
        text("title", "Título", 2),
        text("lead", "Texto de apoio", 3),
      ],
    }),
    defineField({
      name: "clients",
      title: "Clientes",
      description: "Os nomes são cadastrados em “Parceiros / Clientes”",
      type: "object",
      group: "clients",
      fields: [text("label", "Rótulo")],
    }),
    defineField({
      name: "contact",
      title: "Contato",
      type: "object",
      group: "contact",
      fields: [
        text("eyebrow", "Chamada acima do título"),
        text("title", "Título", 2),
        text("lead", "Texto de apoio", 3),
        text("legalPrefix", "Texto antes do link da Política de Privacidade"),
        text("submitLabel", "Texto do botão de envio"),
        text("successLabel", "Rótulo após envio (ex.: MENSAGEM ENVIADA)"),
        text("successText", "Mensagem após envio"),
        text("resetLabel", "Texto do link para enviar outra mensagem"),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Página Inicial" }),
  },
});
