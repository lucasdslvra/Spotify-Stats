import { useState, useMemo, useEffect } from "react";

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

export interface MonthlyStats {
  month: string;
  [key: string]: number | string;
}

export interface SpotifyStats {
  totalMsPlayed: number;
  uniqueArtists: number;
  uniqueTracks: number;
  topArtists: ArtistStats[];
  topTracks: TrackStats[];
  monthlyStats: MonthlyStats[];
  monthlyTopTracksStats: any[];
  totalFiles: number;
}

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export const useSpotifyData = () => {
  const [rawEntries, setRawEntries] = useState<SpotifyPlayHistory[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
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
      
      setRawEntries(allEntries);
      setTotalFiles(files.length);
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue s'est produite.");
    } finally {
      setIsProcessing(false);
    }
  };

  const availableYears = useMemo(() => {
    if (!rawEntries.length) return [];
    const years = new Set<number>();
    for (const entry of rawEntries) {
      if (entry.ts) {
        const year = new Date(entry.ts).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [rawEntries]);

  // Initialiser les années sélectionnées avec toutes les années disponibles au chargement
  useEffect(() => {
    setSelectedYears(availableYears);
  }, [availableYears]);

  const stats = useMemo(() => {
    if (!rawEntries.length) return null;

    let totalMsPlayed = 0;
    const artistMsMap = new Map<string, number>();
    const trackCountMap = new Map<string, number>();
    const uniqueArtists = new Set<string>();
    const uniqueTracks = new Set<string>();
    
    // Structure pour les stats mensuelles
    const monthYearMap: Record<number, Record<string, number>> = {};
    const monthTrackCountMap: Record<number, Record<string, number>> = {};
    for (let i = 0; i < 12; i++) {
      monthYearMap[i] = {};
      monthTrackCountMap[i] = {};
      availableYears.forEach(y => {
        monthYearMap[i][y.toString()] = 0;
      });
    }

    for (const entry of rawEntries) {
      if (!entry.master_metadata_album_artist_name || !entry.master_metadata_track_name) {
        continue;
      }
      if (entry.ms_played < 30000) {
        continue;
      }

      const date = new Date(entry.ts);
      const entryYear = date.getFullYear();
      const entryMonth = date.getMonth();

      // On n'intègre les données que si l'année est sélectionnée
      if (!selectedYears.includes(entryYear)) {
        continue;
      }

      // Stats mensuelles
      if (monthYearMap[entryMonth]) {
        monthYearMap[entryMonth][entryYear.toString()] = (monthYearMap[entryMonth][entryYear.toString()] || 0) + entry.ms_played;
      }

      const artistName = entry.master_metadata_album_artist_name;
      const trackName = entry.master_metadata_track_name;
      const trackKey = `${trackName}::${artistName}`;

      totalMsPlayed += entry.ms_played;
      artistMsMap.set(artistName, (artistMsMap.get(artistName) || 0) + entry.ms_played);
      uniqueArtists.add(artistName);
      trackCountMap.set(trackKey, (trackCountMap.get(trackKey) || 0) + 1);
      uniqueTracks.add(trackKey);
      
      monthTrackCountMap[entryMonth][trackKey] = (monthTrackCountMap[entryMonth][trackKey] || 0) + 1;
    }

    const topArtists = Array.from(artistMsMap.entries())
      .map(([name, msPlayed]) => ({ name, msPlayed }))
      .sort((a, b) => b.msPlayed - a.msPlayed)
      .slice(0, 15);

    const topTracks = Array.from(trackCountMap.entries())
      .map(([key, playCount]) => {
        const [name, artist] = key.split("::");
        return { name, artist, playCount };
      })
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 15);

    // Formatage des stats mensuelles (on renvoie uniquement pour les années sélectionnées)
    const monthlyStats: MonthlyStats[] = MONTH_NAMES.map((month, index) => {
      const data: MonthlyStats = { month };
      selectedYears.forEach(year => {
        const ms = monthYearMap[index][year.toString()] || 0;
        data[year.toString()] = Number((ms / (1000 * 60 * 60)).toFixed(2));
      });
      return data;
    });

    const top5Tracks = topTracks.slice(0, 5);
    const monthlyTopTracksStats = MONTH_NAMES.map((month, index) => {
      const data: any = { month };
      top5Tracks.forEach((t, i) => {
        const trackKey = `${t.name}::${t.artist}`;
        data[`track_${i}`] = monthTrackCountMap[index][trackKey] || 0;
      });
      return data;
    });

    return {
      totalMsPlayed,
      uniqueArtists: uniqueArtists.size,
      uniqueTracks: uniqueTracks.size,
      topArtists,
      topTracks,
      monthlyStats,
      monthlyTopTracksStats,
      totalFiles,
    };
  }, [rawEntries, selectedYears, totalFiles, availableYears]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year].sort((a, b) => b - a)
    );
  };

  const selectAllYears = () => {
    setSelectedYears(availableYears);
  };

  const clearAllYears = () => {
    setSelectedYears([]);
  };

  return { 
    processFiles, 
    stats, 
    isProcessing, 
    error, 
    availableYears, 
    selectedYears, 
    toggleYear, 
    selectAllYears,
    clearAllYears
  };
};
