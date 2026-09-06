/**
 * Configuration centrale de l'application.
 * Modifier le nom, la description ou l'URL ici met à jour l'onglet du navigateur,
 * le manifest PWA, l'image Open Graph, le sitemap et le robots.txt.
 */
export const siteConfig = {
  name: "SpotiFiles",
  shortName: "SpotiFiles",
  tagline: "Vos statistiques d'écoute",
  description:
    "Analysez votre historique d'écoute Spotify : top artistes, top titres, évolution mensuelle et toile des collaborations. Importez vos archives .json ou connectez votre compte.",
  locale: "fr_FR",
  lang: "fr",
  themeColor: "#050505",
  accentColor: "#1DB954",
  keywords: [
    "statistiques spotify",
    "historique écoute",
    "extended streaming history",
    "top artistes",
    "top titres",
    "wrapped",
  ],
} as const;

/**
 * URL publique du site.
 * - En prod : NEXT_PUBLIC_SITE_URL si défini, sinon l'URL fournie par Vercel.
 * - En local : http://localhost:3000
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
