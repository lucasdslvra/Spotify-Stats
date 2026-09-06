import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    /** Présent quand le rafraîchissement du token Spotify a échoué. */
    error?: "RefreshAccessTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    /** Timestamp (ms) d'expiration de l'access token Spotify. */
    accessTokenExpires?: number;
    error?: "RefreshAccessTokenError";
  }
}
