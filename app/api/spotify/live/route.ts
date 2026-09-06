import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_TIME_RANGES = ["short_term", "medium_term", "long_term"] as const;
type TimeRange = (typeof VALID_TIME_RANGES)[number];

function parseTimeRange(value: string | null): TimeRange {
  return VALID_TIME_RANGES.includes(value as TimeRange) ? (value as TimeRange) : "medium_term";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken || session.error) {
      return NextResponse.json(
        { error: "Session Spotify absente ou expirée. Connectez-vous à Spotify." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const timeRange = parseTimeRange(searchParams.get("time_range"));

    const headers = { Authorization: `Bearer ${session.accessToken}` };

    // Requêtes concurrentes : top de la période demandée + les deux autres
    // périodes, uniquement pour enrichir la toile des collaborations.
    const [artistsRes, tracksRes, shortTracksRes, longTracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, {
        headers,
        cache: "no-store",
      }),
      fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, {
        headers,
        cache: "no-store",
      }),
      fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50`, {
        headers,
        cache: "no-store",
      }),
      fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50`, {
        headers,
        cache: "no-store",
      }),
    ]);

    if (artistsRes.status === 401 || tracksRes.status === 401) {
      return NextResponse.json(
        { error: "Session Spotify absente ou expirée. Connectez-vous à Spotify." },
        { status: 401 },
      );
    }

    if (artistsRes.status === 429 || tracksRes.status === 429) {
      return NextResponse.json(
        { error: "Spotify limite temporairement les requêtes. Réessayez dans un instant." },
        { status: 429 },
      );
    }

    if (!artistsRes.ok || !tracksRes.ok) {
      throw new Error("Réponse invalide de l'API Spotify");
    }

    const artistsData = await artistsRes.json();
    const tracksData = await tracksRes.json();
    const shortTracksData = shortTracksRes.ok ? await shortTracksRes.json() : { items: [] };
    const longTracksData = longTracksRes.ok ? await longTracksRes.json() : { items: [] };

    // Titres agrégés servant uniquement à détecter les featurings.
    const allNetworkTracks = [
      ...tracksData.items,
      ...shortTracksData.items,
      ...longTracksData.items,
    ];

    return NextResponse.json({
      artists: artistsData.items,
      tracks: tracksData.items,
      networkTracks: allNetworkTracks,
    });
  } catch (error: unknown) {
    console.error("Spotify Live API Error:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer vos statistiques Spotify." },
      { status: 500 },
    );
  }
}
