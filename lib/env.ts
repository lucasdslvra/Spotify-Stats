/**
 * Accès validé aux variables d'environnement.
 * Les getters sont volontairement paresseux : ils ne sont évalués qu'au moment
 * d'une requête, pour ne pas faire échouer `next build` dans un environnement
 * où les secrets ne sont pas encore injectés.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Copiez .env.example vers .env.local et renseignez-la.`,
    );
  }
  return value;
}

export function getSpotifyCredentials() {
  return {
    clientId: required("SPOTIFY_CLIENT_ID"),
    clientSecret: required("SPOTIFY_CLIENT_SECRET"),
  };
}

export function getSpotifyBasicAuth(): string {
  const { clientId, clientSecret } = getSpotifyCredentials();
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export const isProduction = process.env.NODE_ENV === "production";

/** Lève une erreur explicite si la configuration Spotify est incomplète. */
export function assertSpotifyEnv(): void {
  getSpotifyCredentials();
  if (isProduction && !process.env.NEXTAUTH_SECRET) {
    throw new Error(
      "Variable d'environnement manquante : NEXTAUTH_SECRET (obligatoire en production).",
    );
  }
}
