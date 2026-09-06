import { NextResponse } from "next/server";
import { getSpotifyBasicAuth } from "@/lib/env";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { SpotifyArtist, SpotifyTrack } from "@/lib/spotify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Bornes de la requête, pour éviter qu'un appelant ne déclenche des milliers d'appels Spotify. */
const MAX_ARTISTS = 250;
const MAX_TRACKS = 120;
const CHUNK_SIZE = 8;
const CHUNK_DELAY_MS = 150;

/** Quota par IP : 30 requêtes par minute. */
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

interface TrackQuery {
  key: string;
  name: string;
  artist: string;
}

/**
 * Token « client credentials » mutualisé entre les requêtes de la même instance.
 * Sans ce cache, chaque appel consommait un token Spotify supplémentaire.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${getSpotifyBasicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Échec de l'authentification auprès de Spotify");
  }

  const data = await response.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Exécute `task` par paquets, avec une pause entre chaque paquet (anti-429). */
async function inChunks<T>(items: T[], task: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    await Promise.all(items.slice(i, i + CHUNK_SIZE).map(task));
    if (i + CHUNK_SIZE < items.length) await delay(CHUNK_DELAY_MS);
  }
}

export async function POST(req: Request) {
  const limit = rateLimit(`images:${getClientIp(req)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Trop de requêtes. Patientez quelques instants." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const body = await req.json();

    const tracks: TrackQuery[] = Array.isArray(body?.tracks)
      ? body.tracks
          .filter((t: unknown): t is TrackQuery => {
            const track = t as TrackQuery;
            return Boolean(track?.key && track?.name && track?.artist);
          })
          .slice(0, MAX_TRACKS)
      : [];

    const artists: string[] = Array.isArray(body?.artists)
      ? body.artists
          .filter((a: unknown): a is string => typeof a === "string" && a.length > 0)
          .slice(0, MAX_ARTISTS)
      : [];

    if (tracks.length === 0 && artists.length === 0) {
      return NextResponse.json({ trackImages: {}, artistImages: {}, artistGenres: {} });
    }

    const token = await getAccessToken();
    const authHeaders = { Authorization: `Bearer ${token}` };

    const trackImages: Record<string, string> = {};
    await inChunks(tracks, async (track) => {
      try {
        const query = `track:${track.name} artist:${track.artist}`;
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
          { headers: authHeaders, cache: "no-store" },
        );
        if (!response.ok) return;

        const data = await response.json();
        const item: SpotifyTrack | undefined = data.tracks?.items?.[0];
        const image = item?.album?.images?.[0]?.url;
        if (image) trackImages[track.key] = image;
      } catch {
        // Une pochette manquante n'est pas bloquante : on ignore l'échec.
      }
    });

    const artistImages: Record<string, string> = {};
    const artistGenres: Record<string, string[]> = {};
    await inChunks(artists, async (artistName) => {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
          { headers: authHeaders, cache: "no-store" },
        );
        if (!response.ok) return;

        const data = await response.json();
        const item: SpotifyArtist | undefined = data.artists?.items?.[0];
        if (!item) return;

        if (item.images?.[0]?.url) artistImages[artistName] = item.images[0].url;
        if (item.genres?.length) artistGenres[artistName] = item.genres;
      } catch {
        // Idem : on continue avec les artistes restants.
      }
    });

    return NextResponse.json({ trackImages, artistImages, artistGenres });
  } catch (error: unknown) {
    console.error("Spotify Images API Error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les visuels Spotify." },
      { status: 500 },
    );
  }
}
