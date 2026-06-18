import { NextResponse } from "next/server";
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

    const headers = { Authorization: `Bearer ${session.accessToken}` };
    
    // Fetch Top Artists and Tracks concurrently to save time
    const [artistsRes, tracksRes, shortTracksRes, longTracksRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, { headers }),
      fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, { headers }),
      fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50`, { headers }),
      fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50`, { headers })
    ]);

    if (!artistsRes.ok || !tracksRes.ok) {
      throw new Error("Failed to fetch Spotify data");
    }

    const artistsData = await artistsRes.json();
    const tracksData = await tracksRes.json();
    const shortTracksData = shortTracksRes.ok ? await shortTracksRes.json() : { items: [] };
    const longTracksData = longTracksRes.ok ? await longTracksRes.json() : { items: [] };

    // Combine all unique tracks for the network map to find all possible featurings
    const allNetworkTracks = [...tracksData.items, ...shortTracksData.items, ...longTracksData.items];

    return NextResponse.json({
      artists: artistsData.items,
      tracks: tracksData.items,
      networkTracks: allNetworkTracks
    });
  } catch (error: any) {
    console.error("Spotify Live API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
