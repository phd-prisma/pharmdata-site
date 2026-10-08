import type { HomeContent } from "@/lib/sanity/types";

export const defaultContent: HomeContent = {
  settings: {
    siteTitle:
      "Pharmdata — Infraestrutura de dados regulatórios de medicamentos",
    description:
      "Especialistas em informação de medicamentos no Brasil, entregando dados estruturados e interoperáveis com curadoria contínua.",
    brandName: "Pharmdata",
    navigation: [
      { label: "Problema", href: "#problema" },
      { label: "Solução", href: "#solucao" },
      { label: "Diferenciais", href: "#diferenciais" },
      { label: "Quem somos", href: "#equipe" },
      { label: "Contato", href: "#contato" },
    ],
    headerCta: { label: "Fale com um especialista", href: "#contato" },
    contactEmail: "comercial@pharmdata.com.br",
    linkedinUrl: "https://www.linkedin.com/company/pharmdata-ai",
    footerTagline: "Infraestrutura de dados regulatórios de medicamentos",
    privacyPolicyUrl: "/infos/politica-de-privacidade-pharmdata.pdf",
    termsUrl: "/infos/termos-de-uso-pharmdata.pdf",
  },
  home: {
    hero: {
      eyebrow: "Infraestrutura de dados regulatórios de medicamentos",
      title: "Informação de medicamentos, estruturada para o seu sistema.",
      text: "Dados interoperáveis, com curadoria farmacêutica contínua e personalizados para o seu negócio — para criar e escalar sua solução em menos tempo, com menos custo, retrabalho e risco.",
      primaryCta: { label: "Agende uma conversa", href: "#contato" },
      secondaryCta: { label: "Como funciona →", href: "#solucao" },
      recordLabel: "REGISTRO · EXEMPLO",
      recordStatus: "CURADO",
      records: [
        {
          name: "Dipirona monoidratada",
          form: "500 mg · comprimido · caixa com 20",
          fields: [
            { label: "Registro ANVISA", value: "1.0000.0000.001-1" },
            { label: "EAN", value: "7890000000017" },
            { label: "ATC", value: "N02BB02" },
            { label: "TUSS", value: "90000001" },
            { label: "Preço CMED (PMC)", value: "R$ 12,40" },
            { label: "IDMP · PhPID", value: "mapeado" },
          ],
        },
        {
          name: "Losartana potássica",
          form: "50 mg · comprimido revestido · caixa com 30",
          fields: [
            { label: "Registro ANVISA", value: "1.0000.0000.014-3" },
            { label: "EAN", value: "7890000000284" },
            { label: "ATC", value: "C09CA01" },
            { label: "TUSS", value: "90000187" },
            { label: "Preço CMED (PMC)", value: "R$ 18,90" },
            { label: "IDMP · PhPID", value: "mapeado" },
          ],
        },
        {
          name: "Amoxicilina tri-hidratada",
          form: "500 mg · cápsula dura · caixa com 21",
          fields: [
            { label: "Registro ANVISA", value: "1.0000.0000.022-7" },
            { label: "EAN", value: "7890000000451" },
            { label: "ATC", value: "J01CA04" },
            { label: "TUSS", value: "90000342" },
            { label: "Preço CMED (PMC)", value: "R$ 27,15" },
            { label: "IDMP · PhPID", value: "em curadoria" },
          ],
        },
      ],
    },
    stats: [
      { value: "+35.000", label: "medicamentos harmonizados semanticamente" },
      { value: "Contínua", label: "atualização da base regulatória" },
      {
        value: "Nacional",
        label: "atuação em iniciativas de interoperabilidade",
      },
    ],
    problem: {
      eyebrow: "01 — O problema",
      title: "O desafio estrutural das informações de medicamentos no Brasil",
      lead: "Organizações de saúde e tecnologia enfrentam um problema comum — muitas vezes invisível, mas crítico para a segurança e a eficiência do sistema.",
      impactLabel: "IMPACTO NO SEU NEGÓCIO",
      items: [
        {
          title: "Fragmentação dos dados semânticos",
          description:
            "A mesma informação sobre medicamentos aparece de formas diferentes em sistemas distintos, impedindo a interoperabilidade real.",
          impact:
            "Retrabalho constante, baixa automação e inconsistência entre sistemas — custo operacional maior e entregas de produto atrasadas.",
        },
        {
          title: "Ausência de padronização semântica",
          description:
            "Diferenças de nomenclatura, granularidade e estrutura tornam inviável a troca segura de informações.",
          impact:
            "Integrações mais longas e mapeamentos complexos, consumindo a capacidade do time e encarecendo a manutenção.",
        },
        {
          title: "Risco regulatório e operacional",
          description:
            "Dados desatualizados ou inconsistentes geram retrabalho, risco e baixa rastreabilidade.",
          impact:
            "Risco elevado de não conformidade e de incidentes assistenciais, além de custos com auditorias, correções e mitigação.",
        },
        {
          title: "Dependência de processos manuais",
          description:
            "Esforços de saneamento e consultorias pontuais não são sustentáveis e não acompanham o mercado.",
          impact:
            "Dependência de mão de obra qualificada e alto custo por mudança, impossibilitando uma escala previsível.",
        },
      ],
    },
    solution: {
      eyebrow: "02 — A solução",
      title: "Uma camada de infraestrutura, integrada ao que você já tem.",
      lead: "A Pharmdata se conecta aos sistemas existentes sem competir com eles. Três etapas transformam dado bruto em informação pronta para consumo.",
      steps: [
        {
          stage: "ETAPA 01",
          tag: "HARMONIZAÇÃO",
          title: "Captura e harmonização",
          description:
            "Consolidamos informações regulatórias de múltiplas fontes oficiais e de mercado, com limpeza, normalização e padronização semântica.",
          output:
            "Dado bruto vira uma base harmonizada e consistente, pronta para estruturação.",
        },
        {
          stage: "ETAPA 02",
          tag: "CURADORIA",
          title: "Curadoria farmacêutica",
          description:
            "Cada dado é validado por profissionais com profundo domínio regulatório, garantindo precisão e alinhamento às normas vigentes.",
          output:
            "Confiabilidade elevada, com rastreabilidade e curadoria contínua.",
        },
        {
          stage: "ETAPA 03",
          tag: "DISTRIBUIÇÃO",
          title: "Entrega interoperável",
          description:
            "Bases estruturadas e APIs desenhadas para acesso simples e direto à informação.",
          output:
            "Atributos certos para o seu caso de uso, prontos para consumo via integração ou API.",
        },
      ],
    },
    differentials: {
      eyebrow: "03 — Por que a Pharmdata",
      title: "Diferenciais",
      items: [
        {
          title: "Infraestrutura, não aplicação",
          description:
            "Não disputamos a interface nem o usuário final. Somos uma base neutra que habilita todo o ecossistema farmacêutico a construir soluções com dados de alta qualidade.",
        },
        {
          title: "Tecnologia com validação humana",
          description:
            "A automação escala o processamento; o especialista assegura o contexto clínico-regulatório. Precisão, rastreabilidade e consistência em dados críticos.",
        },
        {
          title: "Vantagem estratégica em IDMP",
          description:
            "Implementação antecipada de padrões internacionais, posicionando clientes à frente das exigências regulatórias futuras.",
        },
        {
          title: "Autoridade regulatória aplicada",
          description:
            "Conhecimento profundo do contexto brasileiro — ANVISA, CMED, RDCs, SNCR — traduzido em dados estruturados e utilizáveis.",
        },
      ],
      resultLabel: "Resultado:",
      resultText:
        "dados acionáveis, auditáveis e alinhados às exigências do ecossistema regulatório e assistencial.",
    },
    team: {
      eyebrow: "04 — Quem somos",
      title: "Farmacêuticos e tecnólogos, lado a lado.",
      lead: "Experiência em farmacovigilância, indústria, farmácia hospitalar e clínica e segurança do paciente, somada a modelagem de dados, interoperabilidade em saúde e governança da informação.",
    },
    clients: { label: "CLIENTES E PARCEIROS" },
    contact: {
      eyebrow: "05 — Contato",
      title: "Os dados que você precisa, no formato que seu sistema consome.",
      lead: "Reduza custo, retrabalho e risco enquanto acelera integrações. Converse com nosso time sobre como a Pharmdata se encaixa na sua arquitetura.",
      legalPrefix: "Ao enviar, declaro estar de acordo com a",
      submitLabel: "Agendar conversa",
      successLabel: "MENSAGEM ENVIADA",
      successText: "Obrigado. Retornamos em até um dia útil.",
      resetLabel: "Enviar outra mensagem",
    },
  },
  team: [
    {
      _id: "1",
      name: "Eugênio Neves",
      role: "CEO e Fundador",
      linkedinUrl: "https://www.linkedin.com/in/eneves/",
      photoUrl: "https://pharmdata.com.br/imagens/home/eugenio-neves.webp",
    },
    {
      _id: "2",
      name: "Camila Canuto Campioni",
      role: "Head de Produto",
      linkedinUrl: "https://www.linkedin.com/in/camila-canuto-campioni/",
      photoUrl: "https://pharmdata.com.br/imagens/home/camila-campioni.webp",
    },
    {
      _id: "3",
      name: "Amanda Vanon Corrêa",
      role: "Head de Gestão e Curadoria de Dados",
      linkedinUrl: "https://www.linkedin.com/in/amanda-vanon/",
      photoUrl: "https://pharmdata.com.br/imagens/home/amanda-correa.webp",
    },
    {
      _id: "4",
      name: "Bruno Morelli Junior",
      role: "Head de Negócios",
      linkedinUrl: "https://www.linkedin.com/in/brunomorelli/",
      photoUrl: "https://pharmdata.com.br/imagens/home/bruno-morelli.webp",
    },
    {
      _id: "5",
      name: "Gabrielli Guglielmi",
      role: "Head de Suporte Operacional",
      linkedinUrl: "https://www.linkedin.com/in/gabrielliguglielmi/",
      photoUrl:
        "https://pharmdata.com.br/imagens/home/gabrielli-guglielmi.webp",
    },
  ],
  partners: [
    {
      _id: "1",
      name: "Amplí Prescreve",
      logoUrl: "https://pharmdata.com.br/imagens/slider/ampliprescreve.webp",
    },
    {
      _id: "2",
      name: "Apoio",
      logoUrl: "https://pharmdata.com.br/imagens/slider/apoio.webp",
    },
    {
      _id: "3",
      name: "Prontu+",
      logoUrl: "https://pharmdata.com.br/imagens/slider/prontumais.webp",
    },
  ],
};
