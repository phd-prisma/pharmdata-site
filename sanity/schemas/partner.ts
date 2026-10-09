import { CaseIcon } from "@sanity/icons";
import { defineField, defineType } from "@sanity/types";

export const partner = defineType({
  name: "partner",
  title: "Parceiro / Cliente",
  type: "document",
  icon: CaseIcon,
  fieldsets: [
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
      name: "name",
      title: "Nome",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Tipo",
      type: "string",
      options: {
        list: [
          { title: "Parceiro", value: "partner" },
          { title: "Cliente", value: "client" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
    defineField({
      name: "logo",
      title: "Logo",
      description: "Sem logo, o nome aparece em texto. Prefira PNG ou SVG com fundo transparente.",
      type: "image",
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          description: "Sem ele, é usado o nome",
          type: "string",
        }),
      ],
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
      media: "logo",
      kind: "kind",
      hasLogo: "logo.asset",
    },
    prepare: ({ title, media, kind, hasLogo }) => ({
      title,
      subtitle: [
        { partner: "Parceiro", client: "Cliente" }[kind as string],
        !hasLogo && "Sem logo: exibido em texto",
      ]
        .filter(Boolean)
        .join(" · "),
      media: media ?? CaseIcon,
    }),
  },
});
