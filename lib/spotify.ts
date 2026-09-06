/** Types minimaux de l'API Web Spotify, limités aux champs réellement utilisés. */

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtistRef {
  id: string;
  name: string;
}

export interface SpotifyArtist extends SpotifyArtistRef {
  genres?: string[];
  images?: SpotifyImage[];
  popularity?: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images?: SpotifyImage[];
  release_date?: string;
  total_tracks?: number;
  artists?: SpotifyArtistRef[];
  external_urls?: { spotify?: string };
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: SpotifyArtistRef[];
  album?: SpotifyAlbum;
}
