import { DocumentTextIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "@sanity/types";

export const post = defineType({
  name: "post",
  title: "Artigo do Blog",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "content", title: "Conteúdo", default: true },
    { name: "details", title: "Detalhes" },
    { name: "seo", title: "SEO" },
  ],
  orderings: [
    {
      title: "Mais recentes",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Endereço",
      description: "Parte final da URL do artigo.",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Texto",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Parágrafo", value: "normal" },
            { title: "Título", value: "h2" },
            { title: "Subtítulo", value: "h3" },
            { title: "Citação", value: "blockquote" },
          ],
          lists: [
            { title: "Lista", value: "bullet" },
            { title: "Lista numerada", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Negrito", value: "strong" },
              { title: "Itálico", value: "em" },
            ],
            annotations: [
              defineArrayMember({
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({ name: "href", title: "URL", type: "string" }),
                ],
              }),
            ],
          },
        }),
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Texto alternativo", type: "string" }),
            defineField({ name: "caption", title: "Legenda", type: "string" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "excerpt",
      title: "Resumo",
      description: "Aparece na lista de artigos, abaixo do título e nos resultados de busca.",
      type: "text",
      rows: 3,
      group: "details",
    }),
    defineField({
      name: "category",
      title: "Categoria",
      description: "Agrupa os artigos no blog. Ao escrever, aparecem as categorias já usadas.",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "coverImage",
      title: "Imagem de capa",
      description: "Formato horizontal (16:9) funciona melhor.",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          description: "Descreve a imagem para leitores de tela.",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "reference",
      group: "details",
      // Referência fraca: excluir alguém da equipe não fica bloqueado pelos artigos
      weak: true,
      to: [{ type: "teamMember" }],
    }),
    defineField({
      name: "publishedAt",
      title: "Data de publicação",
      description: "Preenchida na primeira publicação.",
      type: "datetime",
      group: "details",
    }),
    defineField({
      name: "seoTitle",
      title: "Título para buscadores",
      description: "Se ficar vazio, é usado o título do artigo.",
      type: "string",
      group: "seo",
    }),
    defineField({
      name: "seoDescription",
      title: "Descrição para buscadores",
      description: "Se ficar vazia, é usado o resumo.",
      type: "text",
      rows: 3,
      group: "seo",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "excerpt",
      media: "coverImage",
    },
  },
});
