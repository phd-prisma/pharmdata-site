// Gera um exemplo do e-mail de contato e abre no navegador: npm run email:preview
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildContactEmail } from "../lib/contact/contactEmail";

const { subject, html } = buildContactEmail(
  {
    nome: "Maria Souza",
    empresa: "Hospital Santa Clara",
    email: "maria.souza@santaclara.com.br",
    telefone: "(11) 98765-4321",
    mensagem:
      "Olá! Somos uma rede com 4 hospitais e estamos revisando nosso cadastro de medicamentos.\n\nGostaria de entender como funciona a integração dos dados regulatórios com o nosso ERP e quais são os prazos de implantação.\n\nObrigada!",
  },
  { receivedAt: new Date("2026-10-19T14:32:00-03:00") },
);

const file = join(process.argv[2] ?? tmpdir(), "pharmdata-contato.html");
writeFileSync(file, html);
console.log(`Assunto: ${subject}\nArquivo: ${file}`);
if (!process.argv[2] && process.platform === "darwin") execFileSync("open", [file]);
