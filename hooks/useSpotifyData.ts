import { useState } from "react";

export interface SpotifyPlayHistory {
  ts: string;
  username: string;
  platform: string;
  ms_played: number;
  conn_country: string;
  ip_addr_decrypted: string;
  user_agent_decrypted: string;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  spotify_track_uri: string | null;
  episode_name: string | null;
  episode_show_name: string | null;
  spotify_episode_uri: string | null;
  reason_start: string;
  reason_end: string;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean;
  offline_timestamp: number;
  incognito_mode: boolean;
}

export interface ArtistStats {
  name: string;
  msPlayed: number;
}

export interface TrackStats {
  name: string;
  artist: string;
  playCount: number;
}

export interface SpotifyStats {
  totalMsPlayed: number;
  uniqueArtists: number;
  uniqueTracks: number;
  topArtists: ArtistStats[];
  topTracks: TrackStats[];
  totalFiles: number;
}

export const useSpotifyData = () => {
  const [stats, setStats] = useState<SpotifyStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const filePromises = files.map((file) => {
        return new Promise<SpotifyPlayHistory[]>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const json = JSON.parse(e.target?.result as string);
              resolve(json);
            } catch (err) {
              reject(new Error(`Échec de l'analyse du fichier JSON: ${file.name}`));
            }
          };
          reader.onerror = () => reject(new Error(`Échec de la lecture du fichier: ${file.name}`));
          reader.readAsText(file);
        });
      });

      const fileResults = await Promise.all(filePromises);
      const allEntries = fileResults.flat();

      let totalMsPlayed = 0;
      const artistMsMap = new Map<string, number>();
      const trackCountMap = new Map<string, number>();
      const uniqueArtists = new Set<string>();
      const uniqueTracks = new Set<string>();

      for (const entry of allEntries) {
        if (!entry.master_metadata_album_artist_name || !entry.master_metadata_track_name) {
          continue;
        }
        if (entry.ms_played < 30000) {
          continue;
        }

        const artistName = entry.master_metadata_album_artist_name;
        const trackName = entry.master_metadata_track_name;
        const trackKey = `${trackName}::${artistName}`;

        // Agrégation Volume Global
        totalMsPlayed += entry.ms_played;

        // Vecteur Artistes
        artistMsMap.set(artistName, (artistMsMap.get(artistName) || 0) + entry.ms_played);
        uniqueArtists.add(artistName);

        // Vecteur Titres
        trackCountMap.set(trackKey, (trackCountMap.get(trackKey) || 0) + 1);
        uniqueTracks.add(trackKey);
      }

      // Top 15 Artistes (Tri décroissant par ms_played)
      const topArtists = Array.from(artistMsMap.entries())
        .map(([name, msPlayed]) => ({ name, msPlayed }))
        .sort((a, b) => b.msPlayed - a.msPlayed)
        .slice(0, 15);

      // Top 15 Titres (Tri décroissant par occurrences)
      const topTracks = Array.from(trackCountMap.entries())
        .map(([key, playCount]) => {
          const [name, artist] = key.split("::");
          return { name, artist, playCount };
        })
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 15);

      setStats({
        totalMsPlayed,
        uniqueArtists: uniqueArtists.size,
        uniqueTracks: uniqueTracks.size,
        topArtists,
        topTracks,
        totalFiles: files.length,
      });
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue s'est produite.");
    } finally {
      setIsProcessing(false);
    }
  };

  return { processFiles, stats, isProcessing, error };
};
