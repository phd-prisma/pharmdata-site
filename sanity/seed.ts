import { loadEnvFile } from "node:process";
import { getCliClient } from "sanity/cli";
import { defaultContent } from "../lib/content/defaults";

try {
  loadEnvFile(".env.local");
} catch {
  // sem .env.local: usa as variáveis já definidas no ambiente
}

const client = getCliClient({
  apiVersion: "2024-01-01",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
});

const items = <T extends object>(type: string, list: T[]) =>
  list.map((item, i) => ({ _type: type, _key: `${type}-${i}`, ...item }));

// Baixa a imagem e envia para o Sanity; em caso de falha, segue sem ela
async function uploadImage(url: string, alt: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} em ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename: url.split("/").pop(),
    });
    return {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      alt,
    };
  } catch (error) {
    console.warn(`Imagem de ${alt} não enviada:`, error);
    return undefined;
  }
}

async function seed() {
  const { settings, home, team, partners } = defaultContent;
  const tx = client.transaction();

  tx.createIfNotExists({
    _id: "siteSettings",
    _type: "siteSettings",
    ...settings,
    navigation: items("link", settings.navigation),
  });

  tx.createIfNotExists({
    _id: "homePage",
    _type: "homePage",
    hero: {
      ...home.hero,
      records: items(
        "record",
        home.hero.records.map((record) => ({
          ...record,
          fields: items("recordField", record.fields),
        })),
      ),
    },
    stats: items("stat", home.stats),
    problem: {
      ...home.problem,
      items: items("problemItem", home.problem.items),
    },
    solution: { ...home.solution, steps: items("step", home.solution.steps) },
    differentials: {
      ...home.differentials,
      items: items("differentialItem", home.differentials.items),
    },
    team: home.team,
    clients: home.clients,
    contact: home.contact,
  });

  const [teamCount, partnerCount] = await Promise.all([
    client.fetch<number>(`count(*[_type == "teamMember"])`),
    client.fetch<number>(`count(*[_type == "partner"])`),
  ]);

  if (teamCount === 0) {
    for (const [i, member] of team.entries()) {
      const photo = member.photoUrl
        ? await uploadImage(member.photoUrl, member.name)
        : undefined;
      tx.create({
        _type: "teamMember",
        order: i + 1,
        name: member.name,
        role: member.role,
        linkedinUrl: member.linkedinUrl,
        ...(photo && { photo }),
      });
    }
  } else {
    console.log(`Equipe já tem ${teamCount} membro(s); pulando.`);
  }

  if (partnerCount === 0) {
    for (const [i, partner] of partners.entries()) {
      const logo = partner.logoUrl
        ? await uploadImage(partner.logoUrl, partner.name)
        : undefined;
      tx.create({
        _type: "partner",
        order: i + 1,
        name: partner.name,
        ...(logo && { logo }),
      });
    }
  } else {
    // Parceiros já cadastrados: só adiciona o logo aos que ainda não têm
    const withoutLogo = await client.fetch<{ _id: string; name: string }[]>(
      `*[_type == "partner" && !defined(logo)]{ _id, name }`,
    );
    for (const existing of withoutLogo) {
      const logoUrl = partners.find((p) => p.name === existing.name)?.logoUrl;
      if (!logoUrl) continue;
      const logo = await uploadImage(logoUrl, existing.name);
      if (logo) tx.patch(existing._id, (patch) => patch.set({ logo }));
    }
    console.log(
      `Parceiros já existem; logo adicionado a ${withoutLogo.length} sem logo.`,
    );
  }

  await tx.commit();
  console.log("Conteúdo importado. Abra /studio para editar.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
