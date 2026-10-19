// E-mail enviado à Pharmdata quando alguém preenche o formulário de contato.
// HTML com estilos inline e tabelas (o que Gmail/Outlook/Apple Mail suportam),
// mais uma versão em texto puro para leitores sem HTML.

export interface ContactData {
  nome: string;
  empresa?: string;
  email: string;
  telefone?: string;
  mensagem?: string;
}

const colors = {
  paper: "#f3f1eb",
  card: "#ffffff",
  soft: "#f8f6f1",
  line: "#e4e0d6",
  ink: "#13201f",
  body: "#3d4b4a",
  muted: "#7a8583",
  teal: "#002a2d",
  tealSoft: "#1f7a7a",
};

const sans = "'IBM Plex Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const serif = "'Source Serif 4', Georgia, 'Times New Roman', serif";

// Tudo que vem do visitante passa por aqui antes de entrar no HTML
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function buildContactEmail(
  data: ContactData,
  { receivedAt = new Date() } = {},
) {
  const firstName = data.nome.split(" ")[0];
  const when = formatDate(receivedAt);

  const subject = `Contato pelo site — ${data.nome}${data.empresa ? ` (${data.empresa})` : ""}`;

  const text = [
    `Novo contato pelo site (${when})`,
    "",
    `Nome: ${data.nome}`,
    `Empresa: ${data.empresa ?? "-"}`,
    `E-mail: ${data.email}`,
    `Telefone: ${data.telefone ?? "-"}`,
    "",
    "Mensagem:",
    data.mensagem ?? "-",
    "",
    `Responda este e-mail para falar diretamente com ${firstName}.`,
  ].join("\n");

  const e = {
    nome: escapeHtml(data.nome),
    firstName: escapeHtml(firstName),
    empresa: data.empresa ? escapeHtml(data.empresa) : "",
    email: escapeHtml(data.email),
    telefone: data.telefone ? escapeHtml(data.telefone) : "",
    mensagem: data.mensagem ? escapeHtml(data.mensagem).replace(/\n/g, "<br />") : "",
  };

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${colors.line};width:92px;padding-right:16px;vertical-align:top;font:500 12px/1.5 ${sans};color:${colors.muted};text-transform:uppercase;letter-spacing:0.06em;">${label}</td>
      <td style="padding:12px 0;border-bottom:1px solid ${colors.line};vertical-align:top;word-break:break-word;font:400 15px/1.5 ${sans};color:${colors.ink};">${value}</td>
    </tr>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(subject)}</title>
<style>
  @media (max-width: 480px) {
    .px { padding-left: 22px !important; padding-right: 22px !important; }
    .outer { padding: 24px 12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${colors.paper};">
  <!-- Prévia exibida ao lado do assunto na caixa de entrada -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${e.nome}${e.empresa ? ` (${e.empresa})` : ""} enviou uma mensagem pelo site.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.paper};">
    <tr>
      <td align="center" class="outer" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Marca -->
          <tr>
            <td style="padding:0 4px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:32px;height:32px;background:${colors.teal};border-radius:8px;text-align:center;vertical-align:middle;font:600 16px/32px ${sans};color:#ffffff;">P</td>
                  <td style="padding-left:10px;font:600 16px/1 ${sans};color:${colors.ink};">Pharmdata</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cartão -->
          <tr>
            <td style="background:${colors.card};border:1px solid ${colors.line};border-radius:16px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:${colors.teal};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="px" style="padding:32px 36px 8px;">
                    <p style="margin:0 0 8px;font:500 12px/1.4 ${sans};color:${colors.tealSoft};text-transform:uppercase;letter-spacing:0.08em;">Novo contato pelo site</p>
                    <h1 style="margin:0;font:600 26px/1.25 ${serif};color:${colors.ink};">${e.firstName} quer conversar com a Pharmdata</h1>
                    <p style="margin:10px 0 0;font:400 14px/1.5 ${sans};color:${colors.muted};">Recebido em ${when}</p>
                  </td>
                </tr>

                <!-- Dados -->
                <tr>
                  <td class="px" style="padding:20px 36px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${colors.line};">
                      ${row("Nome", e.nome)}
                      ${row("Empresa", e.empresa || `<span style="color:${colors.muted};">Não informada</span>`)}
                      ${row("E-mail", e.email)}
                      ${row("Telefone", e.telefone || `<span style="color:${colors.muted};">Não informado</span>`)}
                    </table>
                  </td>
                </tr>

                <!-- Mensagem -->
                <tr>
                  <td class="px" style="padding:28px 36px 0;">
                    <p style="margin:0 0 10px;font:500 12px/1.5 ${sans};color:${colors.muted};text-transform:uppercase;letter-spacing:0.06em;">Mensagem</p>
                    <div style="background:${colors.soft};border-left:3px solid ${colors.tealSoft};border-radius:8px;padding:18px 20px;font:400 15px/1.65 ${sans};color:${colors.body};">
                      ${e.mensagem || `<span style="color:${colors.muted};">Nenhuma mensagem escrita.</span>`}
                    </div>
                  </td>
                </tr>

                <!-- Como responder: sem links, para não acionar filtros de spam -->
                <tr>
                  <td class="px" style="padding:28px 36px 36px;">
                    <div style="background:#e6f0ef;border-radius:10px;padding:14px 18px;font:400 14px/1.55 ${sans};color:${colors.teal};">
                      <strong style="font-weight:600;">Para responder a ${e.firstName},</strong> use o botão Responder do seu e-mail. A resposta vai direto para <span style="word-break:break-all;">${e.email}</span>.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding:20px 4px 0;font:400 12px/1.6 ${sans};color:${colors.muted};">
              Enviado pelo formulário de contato do site da Pharmdata.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
