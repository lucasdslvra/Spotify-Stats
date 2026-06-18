"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import anime from "animejs";
import { UploadCloud, Clock, Music, Users, FileJson, Loader2, Calendar, Database, Mail, Download, History, LogOut } from "lucide-react";
import { useSpotifyData } from "@/hooks/useSpotifyData";
import { signIn, signOut, useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

const ArtistNetworkMap = dynamic(
  () => import('@/components/ArtistNetworkMap').then(mod => mod.ArtistNetworkMap),
  { ssr: false, loading: () => <div className="h-[600px] w-full bg-white/[0.02] animate-pulse rounded-3xl" /> }
);
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

const CustomYAxisTick = ({ x, y, payload, data, images, isTrack }: any) => {
  const item = data[payload.index];
  let imageUrl = null;
  if (item) {
    if (isTrack) {
      imageUrl = images.tracks[item.uri || `${item.name}-${item.artist}`];
    } else if (!isTrack && item.fullName) {
      imageUrl = images.artists[item.fullName];
    }
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-140} y={-14} width={140} height={28}>
        <div className="flex items-center justify-end w-full h-full pr-2 space-x-2">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="" 
              className={cn("w-6 h-6 object-cover shadow-sm bg-neutral-900 border border-white/5", isTrack ? "rounded-md" : "rounded-full")} 
            />
          )}
          <span className="text-xs text-neutral-400 font-light truncate max-w-[80px]" title={item?.fullName}>
            {payload.value}
          </span>
        </div>
      </foreignObject>
    </g>
  );
};

export default function SpotifyDashboard() {
  const { processFiles, stats: archiveStats, isProcessing, error, availableYears, selectedYears, toggleYear, selectAllYears, clearAllYears, images: archiveImages } = useSpotifyData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { data: session } = useSession();
  const [liveStats, setLiveStats] = useState<any>(null);
  const [liveImages, setLiveImages] = useState<{ artists: Record<string, string>; tracks: Record<string, string> }>({ artists: {}, tracks: {} });
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveTimeRange, setLiveTimeRange] = useState("medium_term");
  
  const stats = archiveStats || liveStats;
  const images = {
    artists: { ...archiveImages.artists, ...liveImages.artists },
    tracks: { ...archiveImages.tracks, ...liveImages.tracks }
  };

  const fetchLiveStats = async (timeRange: string) => {
    setIsLiveLoading(true);
    try {
      const res = await fetch(`/api/spotify/live?time_range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        const newLiveImages = { artists: {} as Record<string, string>, tracks: {} as Record<string, string> };
        const nodes: any[] = [];
        const links: any[] = [];
        
        const topArtists = data.artists.map((a: any, i: number) => {
          if (a.images?.[0]?.url) newLiveImages.artists[a.name] = a.images[0].url;
          nodes.push({ id: a.name, val: Math.max(20, a.popularity || 20) });
          
          for (let j = i + 1; j < data.artists.length; j++) {
            const a2 = data.artists[j];
            const shared = a.genres?.filter((g: string) => a2.genres?.includes(g));
            if (shared && shared.length > 0) {
              links.push({ source: a.name, target: a2.name, value: shared.length });
            }
          }
          
          return { name: a.name, msPlayed: Math.round(100 * Math.pow(0.92, i)) };
        });
        const topTracks = data.tracks.map((t: any, i: number) => {
          const artistName = t.artists[0].name;
          const key = t.uri || `${t.name}-${artistName}`;
          if (t.album?.images?.[0]?.url) newLiveImages.tracks[key] = t.album.images[0].url;
          return { name: t.name, artist: artistName, playCount: Math.round(100 * Math.pow(0.92, i)), uri: t.uri };
        });
        setLiveImages(newLiveImages);
        setLiveStats({
          isLive: true,
          totalMsPlayed: 0,
          uniqueArtists: data.artists.length,
          uniqueTracks: data.tracks.length,
          topArtists,
          topTracks,
          monthlyStats: [],
          monthlyTopTracksStats: [],
          networkData: { nodes, links }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLiveLoading(false);
    }
  };

  useEffect(() => {
    if ((session as any)?.accessToken && !archiveStats && !liveStats && !isLiveLoading) {
      fetchLiveStats(liveTimeRange);
    }
  }, [session, archiveStats, liveStats, isLiveLoading, liveTimeRange]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => setIsDragOver(false);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const jsonFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.endsWith(".json")
      );
      if (jsonFiles.length > 0) {
        await processFiles(jsonFiles);
      }
    }
  };

  const formatHours = (ms: number) => {
    return (ms / (1000 * 60 * 60)).toFixed(1);
  };

  useEffect(() => {
    if (stats && !isProcessing) {
      anime({
        targets: '.kpi-card',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        easing: 'easeOutExpo',
        duration: 800
      });

      anime({
        targets: '.chart-card',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100, { start: 200 }),
        easing: 'easeOutExpo',
        duration: 800
      });
    }
  }, [!!stats, isProcessing]);

  useEffect(() => {
    if (stats && !isProcessing) {
      anime({
        targets: '.list-item-anim',
        translateX: [-10, 0],
        opacity: [0, 1],
        delay: anime.stagger(30),
        easing: 'easeOutExpo',
        duration: 500
      });
    }
  }, [stats?.topArtists, stats?.topTracks, isProcessing]);

  // Configurations dynamiques pour les graphiques
  const monthChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    // Palette élégante mais distincte pour différencier les années
    const colors = ["#10b981", "#8b5cf6", "#0ea5e9", "#f43f5e", "#f59e0b", "#d946ef", "#14b8a6"];
    availableYears.forEach((year, i) => {
      config[year.toString()] = {
        label: year.toString(),
        color: colors[i % colors.length],
      };
    });
    return config;
  }, [availableYears]);

  const top5TracksChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    // Palette distincte pour les lignes de l'évolution des musiques
    const colors = ["#10b981", "#8b5cf6", "#0ea5e9", "#f43f5e", "#f59e0b"];
    if (stats?.topTracks) {
      stats.topTracks.slice(0, 5).forEach((t: any, i: number) => {
        config[`track_${i}`] = {
          label: t.name,
          color: colors[i % colors.length],
        };
      });
    }
    return config;
  }, [stats]);

  const topArtistsChartConfig = {
    msPlayed: {
      label: stats?.isLive ? "Score d'affinité" : "Heures d'écoute",
      color: "#10b981", // Emerald
    },
  } satisfies ChartConfig;

  const topTracksChartConfig = {
    playCount: {
      label: stats?.isLive ? "Score d'affinité" : "Écoutes",
      color: "#8b5cf6", // Violet
    },
  } satisfies ChartConfig;

  const top10ArtistsChartData = useMemo(() => {
    if (!stats) return [];
    return stats.topArtists.slice(0, 10).map((a: any) => ({
      name: a.name.length > 15 ? a.name.substring(0, 15) + "..." : a.name,
      fullName: a.name,
      msPlayed: stats.isLive ? a.msPlayed : Number((a.msPlayed / (1000 * 60 * 60)).toFixed(2))
    }));
  }, [stats]);

  const top10TracksChartData = useMemo(() => {
    if (!stats) return [];
    return stats.topTracks.slice(0, 10).map((t: any) => ({
      name: t.name.length > 15 ? t.name.substring(0, 15) + "..." : t.name,
      fullName: `${t.name} - ${t.artist}`,
      playCount: t.playCount,
      uri: t.uri
    }));
  }, [stats]);

  const isAllYearsSelected = availableYears.length > 0 && selectedYears.length === availableYears.length;

  const renderUploadArea = () => {
    if (liveStats && !archiveStats) return null; // Masquer la zone si on est en mode "Live" (Spotify) uniquement
    return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-16 transition-all duration-500 ease-out border rounded-2xl group overflow-hidden",
        isDragOver
          ? "border-white bg-white/[0.02] scale-[1.01]"
          : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.01]",
        stats ? "py-10 opacity-70 hover:opacity-100" : "min-h-[45vh]"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
      <input
        type="file"
        multiple
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {isProcessing || isLiveLoading ? (
        <div className="flex flex-col items-center space-y-6 z-10">
          <Loader2 className="w-10 h-10 text-white animate-spin stroke-[1.5]" />
          <p className="text-sm font-light tracking-wide text-neutral-400">
            {isLiveLoading ? "Connexion à Spotify en cours..." : "Traitement des données en cours..."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6 text-center z-10">
          <UploadCloud className={cn("transition-transform duration-500 group-hover:-translate-y-1 stroke-[1.5]", stats ? "w-8 h-8 text-neutral-300" : "w-12 h-12 text-white")} />
          <div>
            <h3 className={cn("font-light tracking-tight text-white", stats ? "text-lg" : "text-3xl")}>
              {stats ? "Importer d'autres fichiers" : "Déposer les archives Spotify"}
            </h3>
            {!stats && (
              <p className="mt-3 text-sm font-light text-neutral-500">
                Fichiers <span className="font-mono text-neutral-400">Streaming_History_Audio_*.json</span>
              </p>
            )}
          </div>
          {!stats && (
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full px-8 py-6 font-light border-white/10 text-white bg-transparent hover:bg-white hover:text-black transition-colors duration-300">
                Importer vos archives .json
              </Button>
              <div className="text-neutral-600 font-light text-sm">ou</div>
              <Button onClick={() => signIn("spotify")} className="rounded-full px-8 py-6 font-light bg-[#1DB954] hover:bg-[#1ed760] text-black transition-colors duration-300 border-none">
                Se connecter à Spotify (En direct)
              </Button>
            </div>
          )}
          {stats && (
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mt-8 rounded-full px-8 py-4 font-light border-white/10 text-white bg-transparent hover:bg-white hover:text-black transition-colors duration-300">
              Parcourir les fichiers
            </Button>
          )}
        </div>
      )}
    </div>
  )};

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 selection:bg-white/20 pb-24 font-sans selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      <main className="container max-w-6xl px-6 py-16 mx-auto space-y-12 relative z-10">
        <header className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="space-y-3">
            <h1 className="text-5xl font-light tracking-tighter text-white lg:text-6xl flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Statistiques Spotify
            </h1>
            <p className="text-lg font-light text-neutral-500 max-w-2xl">
              Analyse détaillée et minimaliste de votre historique d'écoute {liveStats ? "en direct." : "étendu."}
            </p>
          </div>
          
          {archiveStats && availableYears.length > 0 && (
            <div className="flex flex-col gap-3 min-w-[280px]">
              <div className="flex items-center gap-2 text-neutral-500">
                <Calendar className="w-4 h-4 stroke-[1.5]" />
                <span className="text-xs tracking-widest uppercase font-medium">Période</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all duration-300 font-light rounded-full px-4 py-1", 
                    isAllYearsSelected ? "bg-white text-black border-white" : "text-neutral-400 border-white/10 hover:border-white/30 hover:text-white bg-transparent"
                  )}
                  onClick={selectAllYears}
                >
                  Toutes
                </Badge>
                <Badge 
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all duration-300 font-light rounded-full px-4 py-1", 
                    selectedYears.length === 0 ? "bg-white/10 text-white border-white/20" : "text-neutral-500 border-transparent hover:text-neutral-300 bg-transparent"
                  )}
                  onClick={clearAllYears}
                >
                  Aucune
                </Badge>
                {availableYears.map(year => {
                  const isSelected = selectedYears.includes(year);
                  return (
                    <Badge 
                      key={year}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all duration-300 font-light rounded-full px-4 py-1", 
                        isSelected && !isAllYearsSelected 
                          ? "bg-white/10 text-white border-white/20" 
                          : "text-neutral-400 border-white/10 hover:border-white/30 hover:text-white bg-transparent",
                        isAllYearsSelected && "opacity-40"
                      )}
                      onClick={() => toggleYear(year)}
                    >
                      {year}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {liveStats && !archiveStats && (
            <div className="flex flex-col gap-3 min-w-[280px]">
              <div className="flex items-center justify-between text-neutral-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 stroke-[1.5]" />
                  <span className="text-xs tracking-widest uppercase font-medium">Période Spotify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { signOut(); setLiveStats(null); }} className="h-6 px-2 text-xs text-neutral-400 hover:text-white">
                  <LogOut className="w-3 h-3 mr-1" /> Déconnexion
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "short_term", label: "4 Semaines" },
                  { value: "medium_term", label: "6 Mois" },
                  { value: "long_term", label: "1 An" }
                ].map(tr => (
                  <Badge 
                    key={tr.value}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all duration-300 font-light rounded-full px-4 py-1", 
                      liveTimeRange === tr.value ? "bg-white text-black border-white" : "text-neutral-400 border-white/10 hover:border-white/30 hover:text-white bg-transparent"
                    )}
                    onClick={() => {
                      setLiveTimeRange(tr.value);
                      fetchLiveStats(tr.value);
                    }}
                  >
                    {tr.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </header>

        {error && (
          <div className="p-6 border border-red-500/20 rounded-2xl bg-red-500/5 text-red-200 font-light text-sm">
            {error}
          </div>
        )}

        {/* Upload Area */}
        {renderUploadArea()}

        {/* Tutorial Area */}
        {!stats && !isProcessing && (
          <div className="mt-20 w-full mx-auto">
            <h2 className="text-2xl font-light text-center text-white mb-10">Comment obtenir ses données Spotify ?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative flex flex-col p-6 border border-white/[0.05] bg-white/[0.01] rounded-3xl">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Database className="w-5 h-5 text-neutral-300" />
                </div>
                <h3 className="text-white font-medium mb-2">1. Demander</h3>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Allez dans les <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noreferrer" className="text-neutral-300 hover:text-white underline underline-offset-4 decoration-white/20">paramètres de confidentialité</a> de votre compte Spotify et demandez l'historique de streaming étendu ("Extended streaming history").
                </p>
              </div>
              
              <div className="relative flex flex-col p-6 border border-white/[0.05] bg-white/[0.01] rounded-3xl">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-neutral-300" />
                </div>
                <h3 className="text-white font-medium mb-2">2. Patienter</h3>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Spotify a besoin de temps pour rassembler toutes vos données. Cela prend généralement quelques jours (jusqu'à 30 jours au maximum).
                </p>
              </div>

              <div className="relative flex flex-col p-6 border border-white/[0.05] bg-white/[0.01] rounded-3xl">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-neutral-300" />
                </div>
                <h3 className="text-white font-medium mb-2">3. Extraire</h3>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Vous recevrez un e-mail avec un lien une fois l'archive prête. Téléchargez le dossier <span className="font-mono text-neutral-400">.zip</span> et extrayez-le sur votre ordinateur.
                </p>
              </div>

              <div className="relative flex flex-col p-6 border border-emerald-500/10 bg-emerald-500/5 rounded-3xl">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <UploadCloud className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-emerald-50 font-medium mb-2">4. Analyser</h3>
                <p className="text-sm text-emerald-200/60 font-light leading-relaxed">
                  Glissez les fichiers commençant par <span className="font-mono text-emerald-300/80">Streaming_History_Audio_</span> directement dans la zone au-dessus !
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {isProcessing && !stats && (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.02]" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-[500px] rounded-3xl bg-white/[0.02]" />
              <Skeleton className="h-[500px] rounded-3xl bg-white/[0.02]" />
            </div>
          </div>
        )}

        {/* Dashboard KPIs & Charts */}
        {stats && !isProcessing && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            {/* Matrices KPI */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="kpi-card opacity-0 bg-transparent border-white/[0.08] text-neutral-200 rounded-3xl shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs tracking-widest uppercase font-medium text-neutral-500">Temps d'écoute</CardTitle>
                  <Clock className="w-4 h-4 text-neutral-400 stroke-[1.5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-light tracking-tight text-white">{formatHours(stats.totalMsPlayed)}<span className="text-lg text-neutral-600 ml-1">h</span></div>
                </CardContent>
              </Card>

              <Card className="kpi-card opacity-0 bg-transparent border-white/[0.08] text-neutral-200 rounded-3xl shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs tracking-widest uppercase font-medium text-neutral-500">Titres Uniques</CardTitle>
                  <Music className="w-4 h-4 text-neutral-400 stroke-[1.5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-light tracking-tight text-white">{stats.uniqueTracks.toLocaleString('fr-FR')}</div>
                </CardContent>
              </Card>

              <Card className="kpi-card opacity-0 bg-transparent border-white/[0.08] text-neutral-200 rounded-3xl shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs tracking-widest uppercase font-medium text-neutral-500">Artistes Uniques</CardTitle>
                  <Users className="w-4 h-4 text-neutral-400 stroke-[1.5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-light tracking-tight text-white">{stats.uniqueArtists.toLocaleString('fr-FR')}</div>
                </CardContent>
              </Card>

              <Card className="kpi-card opacity-0 bg-transparent border-white/[0.08] text-neutral-200 rounded-3xl shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs tracking-widest uppercase font-medium text-neutral-500">Fichiers Analysés</CardTitle>
                  <FileJson className="w-4 h-4 text-neutral-400 stroke-[1.5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-light tracking-tight text-white">{stats.totalFiles}</div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Evolution Chart */}
            {!stats?.isLive && (
            <Card className="chart-card opacity-0 bg-transparent border-white/[0.08] text-neutral-200 rounded-3xl shadow-none overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <CardHeader className="pt-8 px-8">
                <CardTitle className="text-xl font-light text-white">Évolution Mensuelle</CardTitle>
                <CardDescription className="text-neutral-500 font-light">Volume horaire comparatif selon les années sélectionnées.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="h-[350px] w-full">
                  {selectedYears.length > 0 ? (
                    <ChartContainer config={monthChartConfig} className="h-[350px] w-full">
                      <BarChart data={stats.monthlyStats} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff15" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} stroke="#737373" fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={12} stroke="#737373" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} cursor={{fill: '#ffffff05'}} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {availableYears.map(year => (
                          selectedYears.includes(year) && (
                            <Bar 
                              key={year} 
                              dataKey={year.toString()} 
                              fill={`var(--color-${year})`} 
                              radius={[2, 2, 0, 0]} 
                              maxBarSize={40}
                            />
                          )
                        ))}
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-600 font-light">
                      Sélectionnez une période pour afficher les données.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Top 5 Tracks Evolution Chart */}
            {!stats?.isLive && (
            <Card className="chart-card opacity-0 bg-transparent border-white/[0.08] text-neutral-200 rounded-3xl shadow-none relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <CardHeader className="pt-8 px-8">
                <CardTitle className="text-xl font-light text-white">Top 5 Titres dans le Temps</CardTitle>
                <CardDescription className="text-neutral-500 font-light">Nombre de lectures mensuelles pour vos titres favoris.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="h-[350px] w-full">
                  {selectedYears.length > 0 && stats.monthlyTopTracksStats.length > 0 ? (
                    <ChartContainer config={top5TracksChartConfig} className="h-[350px] w-full">
                      <LineChart data={stats.monthlyTopTracksStats} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff15" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} stroke="#737373" fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={12} stroke="#737373" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} cursor={{stroke: '#ffffff15', strokeWidth: 2}} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {stats.topTracks.slice(0, 5).map((t: any, i: number) => {
                          const safeKey = `track_${i}`;
                          return (
                            <Line
                              key={safeKey}
                              type="monotone"
                              dataKey={safeKey}
                              stroke={`var(--color-${safeKey})`}
                              strokeWidth={2}
                              dot={{ fill: "#050505", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, fill: "white", stroke: "transparent" }}
                            />
                          );
                        })}
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-600 font-light">
                      Sélectionnez une période pour afficher les données.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Top 10 Charts (Bar) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="chart-card opacity-0 bg-transparent border-white/[0.08] rounded-3xl shadow-none">
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-xl font-light text-white">Top Artistes</CardTitle>
                  <CardDescription className="text-neutral-500 font-light">{stats?.isLive ? "Score d'affinité estimé" : "Heures d'écoute cumulées"}</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="h-[350px]">
                    {top10ArtistsChartData.length > 0 ? (
                      <ChartContainer config={topArtistsChartConfig} className="h-full w-full">
                        <BarChart data={top10ArtistsChartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#ffffff15" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={140} tickLine={false} axisLine={false} stroke="#a3a3a3" fontSize={12} tick={(props) => <CustomYAxisTick {...props} data={top10ArtistsChartData} images={images} isTrack={false} />} />
                          <ChartTooltip content={<ChartTooltipContent labelKey="fullName" />} cursor={{fill: '#ffffff05'}} />
                          <Bar dataKey="msPlayed" fill="var(--color-msPlayed)" radius={[0, 2, 2, 0]} maxBarSize={24} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-600 font-light">Aucune donnée</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="chart-card opacity-0 bg-transparent border-white/[0.08] rounded-3xl shadow-none">
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-xl font-light text-white">Top Titres</CardTitle>
                  <CardDescription className="text-neutral-500 font-light">{stats?.isLive ? "Score d'affinité estimé" : "Nombre de lectures"}</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="h-[350px]">
                    {top10TracksChartData.length > 0 ? (
                      <ChartContainer config={topTracksChartConfig} className="h-full w-full">
                        <BarChart data={top10TracksChartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#ffffff15" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={140} tickLine={false} axisLine={false} stroke="#a3a3a3" fontSize={12} tick={(props) => <CustomYAxisTick {...props} data={top10TracksChartData} images={images} isTrack={true} />} />
                          <ChartTooltip content={<ChartTooltipContent labelKey="fullName" />} cursor={{fill: '#ffffff05'}} />
                          <Bar dataKey="playCount" fill="var(--color-playCount)" radius={[0, 2, 2, 0]} maxBarSize={24} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-600 font-light">Aucune donnée</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Listes détaillées Top 15 (existantes) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="chart-card opacity-0 flex flex-col overflow-hidden bg-transparent border-white/[0.08] rounded-3xl shadow-none">
                <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] pt-6 px-8">
                  <CardTitle className="text-xl font-light text-white">Détail Artistes</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[400px]">
                    <ul className="divide-y divide-white/[0.05]">
                      {stats.topArtists.length > 0 ? (
                        stats.topArtists.map((artist: any, index: number) => (
                          <li key={artist.name} className="list-item-anim opacity-0 flex items-center justify-between p-5 transition-colors hover:bg-white/[0.02] group">
                            <div className="flex items-center space-x-5">
                              <div className="relative">
                                {images.artists[artist.name] ? (
                                  <img src={images.artists[artist.name]} alt={artist.name} className="w-12 h-12 rounded-full object-cover bg-neutral-900 border border-white/10 group-hover:border-white/30 transition-colors" />
                                ) : (
                                  <span className="flex items-center justify-center w-12 h-12 text-sm font-light rounded-full bg-white/[0.03] text-neutral-400 border border-white/[0.05]">
                                    {index + 1}
                                  </span>
                                )}
                                {images.artists[artist.name] && (
                                  <span className="absolute -top-1 -left-1 flex items-center justify-center w-5 h-5 text-[10px] font-medium rounded-full bg-black border border-white/20 text-white">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              <span className="font-light text-neutral-200 group-hover:text-white transition-colors">{artist.name}</span>
                            </div>
                            <span className="text-sm font-light text-neutral-500 tabular-nums">
                              {stats?.isLive ? `Top ${index + 1}` : `${formatHours(artist.msPlayed)} h`}
                            </span>
                          </li>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full p-8 text-neutral-600 font-light">
                          Aucune donnée
                        </div>
                      )}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="chart-card opacity-0 flex flex-col overflow-hidden bg-transparent border-white/[0.08] rounded-3xl shadow-none">
                <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] pt-6 px-8">
                  <CardTitle className="text-xl font-light text-white">Détail Titres</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[400px]">
                    <ul className="divide-y divide-white/[0.05]">
                      {stats.topTracks.length > 0 ? (
                        stats.topTracks.map((track: any, index: number) => (
                          <li key={`${track.name}-${track.artist}`} className="list-item-anim opacity-0 flex items-center justify-between p-5 transition-colors hover:bg-white/[0.02] group">
                            <div className="flex items-center space-x-5">
                              <div className="relative">
                                {images.tracks[track.uri || `${track.name}-${track.artist}`] ? (
                                  <img src={images.tracks[track.uri || `${track.name}-${track.artist}`]} alt={track.name} className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-white/10 group-hover:border-white/30 transition-colors" />
                                ) : (
                                  <span className="flex items-center justify-center w-12 h-12 text-sm font-light rounded-lg bg-white/[0.03] text-neutral-400 border border-white/[0.05]">
                                    {index + 1}
                                  </span>
                                )}
                                {images.tracks[track.uri || `${track.name}-${track.artist}`] && (
                                  <span className="absolute -top-1 -left-1 flex items-center justify-center w-5 h-5 text-[10px] font-medium rounded-full bg-black border border-white/20 text-white shadow-sm">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
                                <span className="font-light text-neutral-200 truncate group-hover:text-white transition-colors">{track.name}</span>
                                <span className="text-xs font-light text-neutral-500 truncate">{track.artist}</span>
                              </div>
                            </div>
                            <span className="text-sm font-light text-neutral-500 tabular-nums">
                              {stats?.isLive ? `Top ${index + 1}` : `${track.playCount.toLocaleString('fr-FR')} x`}
                            </span>
                          </li>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full p-8 text-neutral-600 font-light">
                          Aucune donnée
                        </div>
                      )}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Network Map */}
            {stats.networkData && stats.networkData.nodes.length > 0 && (
              <div className="mt-6">
                <ArtistNetworkMap data={stats.networkData} images={images.artists} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
