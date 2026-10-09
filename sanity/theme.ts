import { buildLegacyTheme } from "sanity";

// Cores da marca (mesma paleta de app/site.css)
const colors = {
  ink: "#13201f",
  card: "#fbfaf6",
  teal: "#0b3b3e",
  muted: "#5d6a68",
  ok: "#3f7a5a",
  amber: "#8a5a1c",
  danger: "#b3402e",
};

export const theme = buildLegacyTheme({
  "--black": colors.ink,
  "--white": colors.card,
  "--gray": colors.muted,
  "--gray-base": colors.muted,

  "--component-bg": colors.card,
  "--component-text-color": colors.ink,

  "--brand-primary": colors.teal,
  "--focus-color": colors.ok,

  "--default-button-color": colors.muted,
  "--default-button-primary-color": colors.teal,
  "--default-button-success-color": colors.ok,
  "--default-button-warning-color": colors.amber,
  "--default-button-danger-color": colors.danger,

  "--state-info-color": colors.teal,
  "--state-success-color": colors.ok,
  "--state-warning-color": colors.amber,
  "--state-danger-color": colors.danger,

  "--main-navigation-color": colors.teal,
  "--main-navigation-color--inverted": colors.card,
});
