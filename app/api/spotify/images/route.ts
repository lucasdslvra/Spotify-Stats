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
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  try {
    const { tracks, artists } = await req.json();
    const token = await getAccessToken();

    const trackImages: Record<string, string> = {};
    if (tracks && tracks.length > 0) {
      // Process tracks in chunks of 5
      for (let i = 0; i < tracks.length; i += 5) {
        const chunk = tracks.slice(i, i + 5);
        await Promise.all(chunk.map(async (t: any) => {
          try {
            const query = `track:${t.name} artist:${t.artist}`;
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
              console.error(`Search API failed for ${query} with status:`, response.status);
              return;
            }
            const data = await response.json();
            if (data.tracks && data.tracks.items.length > 0 && data.tracks.items[0].album.images.length > 0) {
              trackImages[t.key] = data.tracks.items[0].album.images[0].url;
            }
          } catch (e) {
            console.error(`Failed to fetch track ${t.name}`, e);
          }
        }));
        if (i + 5 < tracks.length) await delay(300);
      }
    }

    const artistImages: Record<string, string> = {};
    const artistGenres: Record<string, string[]> = {};
    if (artists && artists.length > 0) {
      // Chunk by 5 to avoid rate limits and add delay
      for (let i = 0; i < artists.length; i += 5) {
        const chunk = artists.slice(i, i + 5);
        await Promise.all(chunk.map(async (artistName: string) => {
          try {
            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
              if (response.status === 429) {
                console.warn(`Rate limit hit for ${artistName}`);
              }
              return;
            }
            const data = await response.json();
            if (data.artists && data.artists.items.length > 0) {
              if (data.artists.items[0].images.length > 0) {
                artistImages[artistName] = data.artists.items[0].images[0].url;
              }
              if (data.artists.items[0].genres) {
                artistGenres[artistName] = data.artists.items[0].genres;
              }
            }
          } catch (e) {
            console.error(`Failed to fetch artist ${artistName}`, e);
          }
        }));
        if (i + 5 < artists.length) await delay(300);
      }
    }

    return NextResponse.json({ trackImages, artistImages, artistGenres });
  } catch (error: any) {
    console.error('Spotify API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
