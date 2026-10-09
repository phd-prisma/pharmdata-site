import { UserIcon } from "@sanity/icons";
import { defineField, defineType } from "@sanity/types";

export const teamMember = defineType({
  name: "teamMember",
  title: "Membro da Equipe",
  type: "document",
  icon: UserIcon,
  fieldsets: [
    {
      name: "identity",
      title: "Identificação",
      options: { columns: 2 },
    },
    {
      name: "display",
      title: "Exibição no site",
      options: { collapsible: true, collapsed: true },
    },
  ],
  orderings: [
    {
      title: "Ordem de exibição",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  fields: [
    defineField({
      name: "photo",
      title: "Foto",
      description: "Formato quadrado funciona melhor. Use o ponto de foco para centralizar o rosto.",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          description: "Descreve a foto para leitores de tela. Sem ele, é usado o nome.",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      fieldset: "identity",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Cargo",
      type: "string",
      fieldset: "identity",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "linkedinUrl",
      title: "LinkedIn",
      description: "URL completa do perfil (ex.: https://www.linkedin.com/in/...)",
      type: "url",
    }),
    defineField({
      name: "order",
      title: "Ordem",
      description: "Menor número aparece primeiro",
      type: "number",
      fieldset: "display",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "role",
      media: "photo",
    },
  },
});
