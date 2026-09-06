import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken || session.error) {
      return NextResponse.json(
        { error: "Session Spotify absente ou expirée. Connectez-vous à Spotify." },
        { status: 401 },
      );
    }

    const headers = { Authorization: `Bearer ${session.accessToken}` };

    // 1. Nombre total d'albums enregistrés
    const initialRes = await fetch("https://api.spotify.com/v1/me/albums?limit=1", {
      headers,
      cache: "no-store",
    });

    if (initialRes.status === 401) {
      return NextResponse.json(
        { error: "Session Spotify absente ou expirée. Connectez-vous à Spotify." },
        { status: 401 },
      );
    }

    if (!initialRes.ok) {
      throw new Error("Impossible de lire la bibliothèque d'albums");
    }

    const initialData = await initialRes.json();
    const totalAlbums: number = initialData.total ?? 0;

    if (totalAlbums === 0) {
      return NextResponse.json(
        { error: "Aucun album enregistré dans votre bibliothèque." },
        { status: 404 },
      );
    }

    // 2. Décalage aléatoire, puis 3. lecture de l'album correspondant
    const randomOffset = Math.floor(Math.random() * totalAlbums);

    const randomAlbumRes = await fetch(
      `https://api.spotify.com/v1/me/albums?limit=1&offset=${randomOffset}`,
      { headers, cache: "no-store" },
    );

    if (!randomAlbumRes.ok) {
      throw new Error("Impossible de récupérer l'album tiré au sort");
    }

    const randomAlbumData = await randomAlbumRes.json();

    if (!randomAlbumData.items?.length) {
      throw new Error("Album introuvable");
    }

    return NextResponse.json({ album: randomAlbumData.items[0].album });
  } catch (error: unknown) {
    console.error("Spotify Random Album API Error:", error);
    return NextResponse.json(
      { error: "Impossible de tirer un album au sort." },
      { status: 500 },
    );
  }
}
