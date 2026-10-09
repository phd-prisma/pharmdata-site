import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import stylistic from "@stylistic/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  stylistic.configs.customize({
    indent: 2,
    quotes: "double",
    semi: true,
    jsx: true,
    braceStyle: "1tbs",
    commaDangle: "always-multiline",
    arrowParens: true,
  }),
  {
    rules: {
      "@stylistic/jsx-one-expression-per-line": "off",
      "@stylistic/multiline-ternary": "off",
      "@stylistic/operator-linebreak": ["error", "after", { overrides: { "?": "before", ":": "before", "|": "before", "&": "before" } }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".sanity/**"]),
]);

export default eslintConfig;
