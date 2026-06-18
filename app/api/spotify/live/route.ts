import { NextResponse } from "next/response";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("time_range") || "medium_term";

    // Fetch Top Artists
    const artistsResponse = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!artistsResponse.ok) {
      throw new Error("Failed to fetch top artists");
    }

    const artistsData = await artistsResponse.json();

    // Fetch Top Tracks
    const tracksResponse = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!tracksResponse.ok) {
      throw new Error("Failed to fetch top tracks");
    }

    const tracksData = await tracksResponse.json();

    return NextResponse.json({
      artists: artistsData.items,
      tracks: tracksData.items
    });
  } catch (error: any) {
    console.error("Spotify Live API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
