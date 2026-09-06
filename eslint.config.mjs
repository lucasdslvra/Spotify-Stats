import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Les pochettes et photos d'artistes viennent des CDN Spotify et sont
      // affichées par centaines : les passer dans next/image ferait exploser
      // le quota d'optimisation d'images sans gain réel (formats déjà optimisés,
      // tailles fixes et connues). Le <img> natif est ici un choix assumé.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
