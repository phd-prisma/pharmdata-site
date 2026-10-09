import { CaseIcon, CogIcon, HomeIcon, UsersIcon } from "@sanity/icons";
import type { StructureResolver } from "sanity/structure";

const byDisplayOrder = [
  { field: "order", direction: "asc" as const },
  { field: "_createdAt", direction: "asc" as const },
];

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Conteúdo")
    .items([
      S.listItem()
        .title("Página Inicial")
        .id("homePage")
        .icon(HomeIcon)
        .child(
          S.document()
            .title("Página Inicial")
            .schemaType("homePage")
            .documentId("homePage"),
        ),
      S.listItem()
        .title("Configurações do Site")
        .id("siteSettings")
        .icon(CogIcon)
        .child(
          S.document()
            .title("Configurações do Site")
            .schemaType("siteSettings")
            .documentId("siteSettings"),
        ),
      S.divider().title("Coleções"),
      S.listItem()
        .title("Membros da Equipe")
        .id("teamMember")
        .icon(UsersIcon)
        .schemaType("teamMember")
        .child(
          S.documentTypeList("teamMember")
            .title("Membros da Equipe")
            .defaultOrdering(byDisplayOrder),
        ),
      S.listItem()
        .title("Parceiros / Clientes")
        .id("partner")
        .icon(CaseIcon)
        .schemaType("partner")
        .child(
          S.documentTypeList("partner")
            .title("Parceiros / Clientes")
            .defaultOrdering(byDisplayOrder),
        ),
    ]);
