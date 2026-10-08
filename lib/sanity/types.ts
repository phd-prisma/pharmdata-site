export interface SanityImage {
  asset: {
    _ref: string;
    _type: string;
  };
  alt?: string;
}

export interface Link {
  label: string;
  href: string;
}

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  linkedinUrl: string;
  photo?: SanityImage;
  photoUrl?: string;
}

export interface Partner {
  _id: string;
  name: string;
  logo?: SanityImage;
  logoUrl?: string;
}

export interface SiteSettings {
  siteTitle: string;
  description: string;
  brandName: string;
  navigation: Link[];
  headerCta: Link;
  contactEmail: string;
  linkedinUrl: string;
  footerTagline: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  ogImage?: SanityImage;
  ogImageUrl?: string;
}

export interface MedicationRecord {
  name: string;
  form: string;
  fields: { label: string; value: string }[];
}

export interface HomePage {
  hero: {
    eyebrow: string;
    title: string;
    text: string;
    primaryCta: Link;
    secondaryCta: Link;
    recordLabel: string;
    recordStatus: string;
    records: MedicationRecord[];
  };
  stats: { value: string; label: string }[];
  problem: {
    eyebrow: string;
    title: string;
    lead: string;
    impactLabel: string;
    items: { title: string; description: string; impact: string }[];
  };
  solution: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: {
      stage: string;
      tag: string;
      title: string;
      description: string;
      output: string;
    }[];
  };
  differentials: {
    eyebrow: string;
    title: string;
    items: { title: string; description: string }[];
    resultLabel: string;
    resultText: string;
  };
  team: { eyebrow: string; title: string; lead: string };
  clients: { label: string };
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    legalPrefix: string;
    submitLabel: string;
    successLabel: string;
    successText: string;
    resetLabel: string;
  };
}

// Campos calculados na query, que não fazem parte do conteúdo final
export interface SiteSettingsQueryResult extends Partial<SiteSettings> {
  privacyPolicyFileUrl?: string;
  termsFileUrl?: string;
}

export interface HomeContent {
  settings: SiteSettings;
  home: HomePage;
  team: TeamMember[];
  partners: Partner[];
}
