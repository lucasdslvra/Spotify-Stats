import { NextResponse } from 'next/server';

const getAccessToken = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials in .env.local');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Spotify access token');
  }

  const data = await response.json();
  return data.access_token;
};

export async function POST(req: Request) {
  try {
    const { tracks, artists } = await req.json();
    const token = await getAccessToken();

    const trackImages: Record<string, string> = {};
    if (tracks && tracks.length > 0) {
      // Extraire l'ID de l'URI (ex: "spotify:track:123" -> "123")
      const trackIds = tracks.map((t: string) => t.split(':').pop()).filter(Boolean);
      // L'API Spotify permet un maximum de 50 IDs par requête
      const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.tracks) {
        data.tracks.forEach((track: any, index: number) => {
          if (track && track.album && track.album.images.length > 0) {
            trackImages[tracks[index]] = track.album.images[0].url;
          }
        });
      }
    }

    const artistImages: Record<string, string> = {};
    if (artists && artists.length > 0) {
      // Recherche individuelle pour chaque artiste
      const artistPromises = artists.map(async (artistName: string) => {
        try {
          const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.artists && data.artists.items.length > 0 && data.artists.items[0].images.length > 0) {
            artistImages[artistName] = data.artists.items[0].images[0].url;
          }
        } catch (e) {
          console.error(`Failed to fetch artist ${artistName}`, e);
        }
      });
      await Promise.all(artistPromises);
    }

    return NextResponse.json({ trackImages, artistImages });
  } catch (error: any) {
    console.error('Spotify API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
