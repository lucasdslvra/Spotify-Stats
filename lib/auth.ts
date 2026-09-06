import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import SpotifyProvider from "next-auth/providers/spotify";
import { getSpotifyBasicAuth } from "@/lib/env";

const SCOPES = [
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
].join(" ");

/** Marge de sécurité avant expiration réelle du token (60 s). */
const EXPIRY_MARGIN_MS = 60 * 1000;

/**
 * Échange le refresh token contre un nouvel access token Spotify.
 * Un access token Spotify n'est valable qu'une heure : sans ce rafraîchissement,
 * une session ouverte depuis plus d'une heure renvoie des 401.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) throw new Error("Refresh token absent");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${getSpotifyBasicAuth()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
      cache: "no-store",
    });

    const refreshed = await response.json();

    if (!response.ok) {
      throw new Error(refreshed?.error_description || "Échec du rafraîchissement du token");
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      // Spotify ne renvoie pas toujours un nouveau refresh token : on garde l'ancien.
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Échec du rafraîchissement du token Spotify", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      // Lecture non bloquante : `next build` importe ce module avant que les
      // secrets ne soient forcément disponibles. La validation réelle a lieu
      // à la requête (voir assertSpotifyEnv / getSpotifyCredentials).
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      authorization: {
        params: { scope: SCOPES },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async jwt({ token, account }) {
      // Première connexion : on stocke les tokens fournis par Spotify.
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        };
      }

      // Token encore valide : rien à faire.
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - EXPIRY_MARGIN_MS) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
