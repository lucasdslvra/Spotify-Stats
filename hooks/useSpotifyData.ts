import { useState, useMemo, useEffect, useRef } from "react";

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
  uri: string | null;
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
  networkData: {
    nodes: { id: string; val: number }[];
    links: { source: string; target: string; value: number }[];
  };
}

const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export const useSpotifyData = () => {
  const [rawEntries, setRawEntries] = useState<SpotifyPlayHistory[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache pour stocker les images récupérées
  const [images, setImages] = useState<{ artists: Record<string, string>; tracks: Record<string, string> }>({ artists: {}, tracks: {} });
  const [genres, setGenres] = useState<Record<string, string[]>>({});
  const requestedImages = useRef<Set<string>>(new Set());

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

  const yearlyData = useMemo(() => {
    const map = new Map<number, {
      totalMsPlayed: number;
      artistMsMap: Map<string, number>;
      trackCountMap: Map<string, { count: number; uri: string | null }>;
      monthTrackCountMap: Record<number, Record<string, number>>;
      monthYearMs: Record<number, number>;
    }>();
    
    for (const entry of rawEntries) {
      if (!entry.master_metadata_album_artist_name || !entry.master_metadata_track_name) continue;
      if (entry.ms_played < 30000) continue;
      
      const date = new Date(entry.ts);
      const entryYear = date.getFullYear();
      const entryMonth = date.getMonth();
      
      if (!map.has(entryYear)) {
        const monthTrackObj: Record<number, Record<string, number>> = {};
        const monthYearMsObj: Record<number, number> = {};
        for (let i = 0; i < 12; i++) {
          monthTrackObj[i] = {};
          monthYearMsObj[i] = 0;
        }
        map.set(entryYear, {
          totalMsPlayed: 0,
          artistMsMap: new Map(),
          trackCountMap: new Map(),
          monthTrackCountMap: monthTrackObj,
          monthYearMs: monthYearMsObj
        });
      }
      
      const yearData = map.get(entryYear)!;
      const artistName = entry.master_metadata_album_artist_name;
      const trackName = entry.master_metadata_track_name;
      const trackKey = `${trackName}::${artistName}`;

      yearData.totalMsPlayed += entry.ms_played;
      yearData.artistMsMap.set(artistName, (yearData.artistMsMap.get(artistName) || 0) + entry.ms_played);
      
      const currentTrack = yearData.trackCountMap.get(trackKey) || { count: 0, uri: null };
      yearData.trackCountMap.set(trackKey, { 
        count: currentTrack.count + 1, 
        uri: currentTrack.uri || entry.spotify_track_uri 
      });
      
      yearData.monthTrackCountMap[entryMonth][trackKey] = (yearData.monthTrackCountMap[entryMonth][trackKey] || 0) + 1;
      yearData.monthYearMs[entryMonth] += entry.ms_played;
    }
    return map;
  }, [rawEntries]);

  const stats = useMemo(() => {
    if (!rawEntries.length) return null;

    let totalMsPlayed = 0;
    const artistMsMap = new Map<string, number>();
    const trackCountMap = new Map<string, { count: number, uri: string | null }>();
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

    for (const year of selectedYears) {
      const yearData = yearlyData.get(year);
      if (!yearData) continue;
      
      totalMsPlayed += yearData.totalMsPlayed;
      
      for (const [artist, ms] of yearData.artistMsMap.entries()) {
        artistMsMap.set(artist, (artistMsMap.get(artist) || 0) + ms);
        uniqueArtists.add(artist);
      }
      
      for (const [trackKey, data] of yearData.trackCountMap.entries()) {
        const current = trackCountMap.get(trackKey) || { count: 0, uri: null };
        trackCountMap.set(trackKey, {
           count: current.count + data.count,
           uri: current.uri || data.uri
        });
        uniqueTracks.add(trackKey);
      }
      
      for (let m = 0; m < 12; m++) {
        monthYearMap[m][year.toString()] = yearData.monthYearMs[m];
        for (const [trackKey, count] of Object.entries(yearData.monthTrackCountMap[m])) {
           monthTrackCountMap[m][trackKey] = (monthTrackCountMap[m][trackKey] || 0) + count;
        }
      }
    }

    const topArtists = Array.from(artistMsMap.entries())
      .map(([name, msPlayed]) => ({ name, msPlayed }))
      .sort((a, b) => b.msPlayed - a.msPlayed)
      .slice(0, 15);

    const topTracks = Array.from(trackCountMap.entries())
      .map(([key, data]) => {
        const [name, artist] = key.split("::");
        return { name, artist, playCount: data.count, uri: data.uri };
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

    // NETWORK MAP COMPUTATION
    const topNetworkArtists = Array.from(artistMsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(x => x[0]);

    const normalizedArtistMap = new Map<string, string>();
    topNetworkArtists.forEach(a => normalizedArtistMap.set(a.toLowerCase(), a));

    const linkMap = new Map<string, number>();

    const parseFeatures = (name: string): string[] => {
      const regex = /(?:feat\.?|ft\.?|featuring)\s+(.+?)(?:\)|$)/i;
      const match = name.match(regex);
      if (!match) return [];
      return match[1].split(/,|\&|\band\b|\+/i).map(s => s.trim()).filter(Boolean);
    };

    for (const trackKey of uniqueTracks) {
      const [trackName, mainArtist] = trackKey.split("::");
      
      const trackArtists = new Set<string>();
      
      // 1. Add main artists (sometimes separated by comma or &)
      mainArtist.split(/,|\&|\band\b|\+/i).forEach(a => {
        const exact = normalizedArtistMap.get(a.trim().toLowerCase());
        if (exact) trackArtists.add(exact);
      });

      // 2. Add featured artists from track name
      const features = parseFeatures(trackName);
      features.forEach(f => {
        const exact = normalizedArtistMap.get(f.toLowerCase());
        if (exact) trackArtists.add(exact);
      });

      // 3. Create links between all associated artists
      const artistArr = Array.from(trackArtists);
      for (let i = 0; i < artistArr.length; i++) {
        for (let j = i + 1; j < artistArr.length; j++) {
          const sorted = [artistArr[i], artistArr[j]].sort();
          const linkId = `${sorted[0]}::${sorted[1]}`;
          linkMap.set(linkId, (linkMap.get(linkId) || 0) + 1);
        }
      }
    }

    // Genre links
    const artistArrForGenres = Array.from(normalizedArtistMap.values());
    for (let i = 0; i < artistArrForGenres.length; i++) {
      const g1 = genres[artistArrForGenres[i]] || [];
      if (g1.length === 0) continue;
      
      for (let j = i + 1; j < artistArrForGenres.length; j++) {
        const g2 = genres[artistArrForGenres[j]] || [];
        if (g2.length === 0) continue;
        
        // Count shared genres
        const shared = g1.filter(g => g2.includes(g)).length;
        if (shared === 0) continue;

        // Jaccard similarity
        const union = new Set([...g1, ...g2]).size;
        const similarity = shared / union;

        // Link only if similarity is strong (> 0.5) OR they share at least 2 distinct genres
        if (shared >= 2 || similarity > 0.5) {
          const sorted = [artistArrForGenres[i], artistArrForGenres[j]].sort();
          const linkId = `${sorted[0]}::${sorted[1]}`;
          // We add a weighted value (0.5 per shared genre, so it's less strong than featurings which are 1.0)
          linkMap.set(linkId, (linkMap.get(linkId) || 0) + (shared * 0.5));
        }
      }
    }

    // Garder uniquement les noeuds qui sont connectés pour éviter d'avoir 1000 points isolés
    // Mais si l'utilisateur veut vraiment "tous" les artistes, on les inclut tous.
    const nodes = topNetworkArtists.map(id => ({
      id,
      val: artistMsMap.get(id) || 0
    }));

    const links = Array.from(linkMap.entries()).map(([key, count]) => {
      const [source, target] = key.split("::");
      return { source, target, value: count };
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
      networkData: { nodes, links }
    };
  }, [yearlyData, selectedYears, totalFiles, availableYears, genres]);

  // Effect pour récupérer les images des Top Artistes et Top Titres
  useEffect(() => {
    if (!stats) return;

    const fetchImages = async () => {
      // Filtrer pour ne demander que ce qu'on n'a pas encore demandé
      const missingArtists = Array.from(new Set([
        ...stats.topArtists.map(a => a.name),
        ...stats.networkData.nodes.map(n => n.id)
      ])).filter(name => !requestedImages.current.has(name));
        
      const missingTracks = stats.topTracks
        .map(t => ({ uri: t.uri, name: t.name, artist: t.artist, key: t.uri || `${t.name}-${t.artist}` }))
        .filter(t => !requestedImages.current.has(t.key));

      if (missingArtists.length === 0 && missingTracks.length === 0) return;

      // Marquer comme demandé immédiatement
      missingArtists.forEach(a => requestedImages.current.add(a));
      missingTracks.forEach(t => requestedImages.current.add(t.key));

      try {
        const res = await fetch('/api/spotify/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artists: missingArtists,
            tracks: missingTracks
          })
        });

        if (res.ok) {
          const data = await res.json();
          setImages(prev => ({
            artists: { ...prev.artists, ...(data.artistImages || {}) },
            tracks: { ...prev.tracks, ...(data.trackImages || {}) }
          }));
          setGenres(prev => ({
            ...prev,
            ...(data.artistGenres || {})
          }));
        }
      } catch (err) {
        console.error("Failed to fetch Spotify images", err);
      }
    };

    fetchImages();
  }, [stats]);

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
    clearAllYears,
    images
  };
};
