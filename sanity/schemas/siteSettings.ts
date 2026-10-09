import {
  BlockElementIcon,
  CogIcon,
  EnvelopeIcon,
  MenuIcon,
  SearchIcon,
} from "@sanity/icons";
import { defineField, defineType } from "@sanity/types";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Configurações do Site",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "seo", title: "SEO", icon: SearchIcon, default: true },
    { name: "header", title: "Cabeçalho", icon: MenuIcon },
    { name: "contact", title: "Contato", icon: EnvelopeIcon },
    { name: "footer", title: "Rodapé", icon: BlockElementIcon },
  ],
  fieldsets: [
    {
      name: "privacy",
      title: "Política de Privacidade",
      description: "Envie o PDF ou informe uma URL. O PDF tem prioridade.",
    },
    {
      name: "terms",
      title: "Termos de Uso",
      description: "Envie o PDF ou informe uma URL. O PDF tem prioridade.",
    },
  ],
  fields: [
    defineField({
      name: "siteTitle",
      title: "Título do Site",
      description: "Aparece na aba do navegador e nos resultados de busca",
      type: "string",
      group: "seo",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Descrição",
      type: "text",
      rows: 3,
      group: "seo",
    }),
    defineField({
      name: "ogImage",
      title: "Imagem de compartilhamento",
      description:
        "Aparece ao compartilhar o link no LinkedIn, WhatsApp etc. Tamanho ideal: 1200×630. Sem imagem, é usada uma arte padrão com o nome da marca.",
      type: "image",
      group: "seo",
    }),
    defineField({
      name: "brandName",
      title: "Nome da marca",
      description: "Logo em texto do cabeçalho e do rodapé",
      type: "string",
      group: "header",
    }),
    defineField({
      name: "navigation",
      title: "Menu",
      type: "array",
      of: [{ type: "link" }],
      group: "header",
    }),
    defineField({
      name: "headerCta",
      title: "Botão do cabeçalho",
      type: "link",
      group: "header",
    }),
    defineField({
      name: "contactEmail",
      title: "E-mail de Contato",
      type: "string",
      group: "contact",
    }),
    defineField({
      name: "linkedinUrl",
      title: "URL do LinkedIn",
      type: "url",
      group: "contact",
    }),
    defineField({
      name: "footerTagline",
      title: "Frase do rodapé",
      type: "string",
      group: "footer",
    }),
    defineField({
      name: "privacyPolicyFile",
      title: "PDF",
      fieldset: "privacy",
      type: "file",
      options: { accept: "application/pdf" },
      group: "footer",
    }),
    defineField({
      name: "privacyPolicyUrl",
      title: "URL",
      fieldset: "privacy",
      type: "url",
      validation: (Rule) => Rule.uri({ allowRelative: true }),
      group: "footer",
    }),
    defineField({
      name: "termsFile",
      title: "PDF",
      fieldset: "terms",
      type: "file",
      options: { accept: "application/pdf" },
      group: "footer",
    }),
    defineField({
      name: "termsUrl",
      title: "URL",
      fieldset: "terms",
      type: "url",
      validation: (Rule) => Rule.uri({ allowRelative: true }),
      group: "footer",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Configurações do Site" }),
  },
});
