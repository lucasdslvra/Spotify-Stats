import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const headers = { Authorization: `Bearer ${session.accessToken}` };
    
    // 1. Fetch total number of saved albums
    const initialRes = await fetch(`https://api.spotify.com/v1/me/albums?limit=1`, { headers });
    
    if (!initialRes.ok) {
      throw new Error("Failed to fetch Spotify saved albums");
    }

    const initialData = await initialRes.json();
    const totalAlbums = initialData.total;

    if (totalAlbums === 0) {
      return NextResponse.json({ error: "No saved albums found in library" }, { status: 404 });
    }

    // 2. Generate random offset
    const randomOffset = Math.floor(Math.random() * totalAlbums);

    // 3. Fetch the random album
    const randomAlbumRes = await fetch(`https://api.spotify.com/v1/me/albums?limit=1&offset=${randomOffset}`, { headers });
    
    if (!randomAlbumRes.ok) {
      throw new Error("Failed to fetch the random Spotify album");
    }

    const randomAlbumData = await randomAlbumRes.json();

    if (!randomAlbumData.items || randomAlbumData.items.length === 0) {
      return NextResponse.json({ error: "Failed to retrieve the random album" }, { status: 500 });
    }

    const randomAlbum = randomAlbumData.items[0].album;

    return NextResponse.json({
      album: randomAlbum
    });
  } catch (error: any) {
    console.error("Spotify Random Album API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
