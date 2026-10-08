import { loadEnvFile } from "node:process";
import { defineCliConfig } from "sanity/cli";

// A CLI do Sanity não lê o .env.local do Next por conta própria
try {
  loadEnvFile(".env.local");
} catch {
  // sem .env.local: usa as variáveis já definidas no ambiente
}

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  },
});
