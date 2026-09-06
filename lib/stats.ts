/** Types partagés entre le hook d'analyse, les graphiques et le dashboard. */

export interface ArtistStats {
  name: string;
  msPlayed: number;
}

export interface TrackStats {
  name: string;
  artist: string;
  playCount: number;
  uri: string | null;
}

/** Point de série mensuelle : { month: "Jan", "2024": 12.5, ... }. */
export interface MonthlyStats {
  month: string;
  [key: string]: number | string;
}

export interface NetworkData {
  nodes: { id: string; val: number }[];
  links: { source: string; target: string; value: number }[];
}

/**
 * Statistiques affichées par le dashboard.
 * Deux sources possibles : les archives importées (mode fichier) ou l'API
 * Spotify (mode direct, `isLive`), d'où les champs optionnels.
 */
export interface DashboardStats {
  isLive?: boolean;
  totalMsPlayed: number;
  uniqueArtists: number;
  uniqueTracks: number;
  topArtists: ArtistStats[];
  topTracks: TrackStats[];
  monthlyStats: MonthlyStats[];
  monthlyTopTracksStats: MonthlyStats[];
  totalFiles?: number;
  networkData: NetworkData;
}

/** Visuels indexés par nom d'artiste et par clé de titre (uri ou "nom-artiste"). */
export interface ImageMaps {
  artists: Record<string, string>;
  tracks: Record<string, string>;
}
