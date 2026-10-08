import { defineField, defineType } from "sanity";

export const partner = defineType({
  name: "partner",
  title: "Parceiro / Cliente",
  type: "document",
  orderings: [
    {
      title: "Ordem de exibição",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  fields: [
    defineField({
      name: "order",
      title: "Ordem",
      description: "Menor número aparece primeiro",
      type: "number",
    }),
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      description: "Sem logo, o nome aparece em texto",
      type: "image",
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          type: "string",
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "logo",
    },
  },
});
