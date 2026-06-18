"use client";

import React, { useRef, useState, useMemo } from "react";
import { UploadCloud, Clock, Music, Users, FileJson, Loader2, Calendar } from "lucide-react";
import { useSpotifyData } from "@/hooks/useSpotifyData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export default function SpotifyDashboard() {
  const { processFiles, stats, isProcessing, error, availableYears, selectedYears, toggleYear, selectAllYears } = useSpotifyData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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

  // Configurations dynamiques pour les graphiques
  const monthChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
    availableYears.forEach((year, i) => {
      config[year.toString()] = {
        label: year.toString(),
        color: colors[i % colors.length],
      };
    });
    return config;
  }, [availableYears]);

  const topArtistsChartConfig = {
    msPlayed: {
      label: "Heures d'écoute",
      color: "#22c55e",
    },
  } satisfies ChartConfig;

  const topTracksChartConfig = {
    playCount: {
      label: "Écoutes",
      color: "#22c55e",
    },
  } satisfies ChartConfig;

  const top10ArtistsChartData = useMemo(() => {
    if (!stats) return [];
    return stats.topArtists.slice(0, 10).map(a => ({
      name: a.name.length > 15 ? a.name.substring(0, 15) + "..." : a.name,
      fullName: a.name,
      msPlayed: Number((a.msPlayed / (1000 * 60 * 60)).toFixed(2))
    }));
  }, [stats]);

  const top10TracksChartData = useMemo(() => {
    if (!stats) return [];
    return stats.topTracks.slice(0, 10).map(t => ({
      name: t.name.length > 15 ? t.name.substring(0, 15) + "..." : t.name,
      fullName: `${t.name} - ${t.artist}`,
      playCount: t.playCount
    }));
  }, [stats]);

  const isAllYearsSelected = availableYears.length > 0 && selectedYears.length === availableYears.length;

  const renderUploadArea = () => (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-12 transition-all duration-300 ease-in-out border-2 border-dashed rounded-xl cursor-pointer bg-slate-900/50 backdrop-blur-sm",
        isDragOver
          ? "border-green-500 bg-green-500/10 scale-[1.02]"
          : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50",
        stats ? "py-8 opacity-60 hover:opacity-100" : "min-h-[40vh]"
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        multiple
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {isProcessing ? (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
          <p className="text-lg font-medium text-slate-300">Analyse de l'historique en cours...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 text-center">
          <UploadCloud className={cn("w-16 h-16", stats ? "w-8 h-8 text-green-500" : "text-green-500")} />
          <div>
            <h3 className={cn("font-semibold text-slate-200", stats ? "text-lg" : "text-2xl")}>
              {stats ? "Importer d'autres fichiers" : "Importer l'historique d'écoute"}
            </h3>
            {!stats && (
              <p className="mt-2 text-slate-400">
                Glissez-déposez vos fichiers <span className="font-mono text-green-400">Streaming_History_Audio_*.json</span> ici
              </p>
            )}
          </div>
          {!stats && (
            <Button variant="secondary" className="mt-4 bg-slate-800 text-slate-200 hover:bg-slate-700">
              Sélectionner des fichiers
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-green-500/30 pb-20">
      <main className="container max-w-6xl px-6 py-12 mx-auto space-y-8">
        <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
              Spotify <span className="text-green-500">Extended</span> Stats
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl">
              Analysez en profondeur votre historique d'écoute à partir des données étendues de Spotify.
            </p>
          </div>
          
          {stats && availableYears.length > 0 && (
            <div className="flex flex-col gap-2 p-4 bg-slate-900/50 rounded-xl border border-slate-800 backdrop-blur-sm min-w-[280px]">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Filtrer par année</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={isAllYearsSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all", 
                    isAllYearsSelected ? "bg-green-500 hover:bg-green-600 text-slate-950" : "text-slate-400 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                  )}
                  onClick={selectAllYears}
                >
                  Toutes
                </Badge>
                {availableYears.map(year => {
                  const isSelected = selectedYears.includes(year);
                  return (
                    <Badge 
                      key={year}
                      variant={isSelected && !isAllYearsSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all", 
                        isSelected && !isAllYearsSelected 
                          ? "bg-slate-700 hover:bg-slate-600 text-white border-transparent" 
                          : "text-slate-400 border-slate-700 hover:border-slate-500 hover:bg-slate-800",
                        isAllYearsSelected && "opacity-60"
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
        </header>

        {error && (
          <div className="p-4 border-l-4 border-red-500 rounded-md bg-red-500/10 text-red-200">
            {error}
          </div>
        )}

        {/* Upload Area */}
        {renderUploadArea()}

        {/* Loading Skeletons */}
        {isProcessing && !stats && (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl bg-slate-900" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-[500px] rounded-xl bg-slate-900" />
              <Skeleton className="h-[500px] rounded-xl bg-slate-900" />
            </div>
          </div>
        )}

        {/* Dashboard KPIs & Charts */}
        {stats && !isProcessing && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Matrices KPI */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-slate-900 border-slate-800 text-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-400">Temps d'écoute total</CardTitle>
                  <Clock className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatHours(stats.totalMsPlayed)}<span className="text-xl text-slate-500">h</span></div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 text-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-400">Titres uniques</CardTitle>
                  <Music className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.uniqueTracks.toLocaleString('fr-FR')}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 text-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-400">Artistes uniques</CardTitle>
                  <Users className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.uniqueArtists.toLocaleString('fr-FR')}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 text-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-400">Fichiers traités</CardTitle>
                  <FileJson className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalFiles}</div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Comparison Chart */}
            <Card className="bg-slate-900 border-slate-800 text-slate-200">
              <CardHeader>
                <CardTitle>Évolution de l'écoute par mois</CardTitle>
                <CardDescription className="text-slate-400">Comparaison du volume horaire (en heures) par mois pour les années sélectionnées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {selectedYears.length > 0 ? (
                    <ChartContainer config={monthChartConfig} className="h-[400px] w-full">
                      <BarChart data={stats.monthlyStats} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} stroke="#94a3b8" />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} stroke="#94a3b8" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        {availableYears.map(year => (
                          selectedYears.includes(year) && (
                            <Bar 
                              key={year} 
                              dataKey={year.toString()} 
                              fill={`var(--color-${year})`} 
                              radius={[4, 4, 0, 0]} 
                            />
                          )
                        ))}
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      Sélectionnez au moins une année pour afficher le graphique
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top 10 Charts (Bar) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top 10 Artists Chart */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100">Top 10 Artistes</CardTitle>
                  <CardDescription className="text-slate-400">Heures d'écoute cumulées</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    {top10ArtistsChartData.length > 0 ? (
                      <ChartContainer config={topArtistsChartConfig} className="h-full w-full">
                        <BarChart data={top10ArtistsChartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#334155" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent labelKey="fullName" />} />
                          <Bar dataKey="msPlayed" fill="var(--color-msPlayed)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">Aucune donnée</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top 10 Tracks Chart */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100">Top 10 Titres</CardTitle>
                  <CardDescription className="text-slate-400">Nombre de lectures</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    {top10TracksChartData.length > 0 ? (
                      <ChartContainer config={topTracksChartConfig} className="h-full w-full">
                        <BarChart data={top10TracksChartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#334155" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent labelKey="fullName" />} />
                          <Bar dataKey="playCount" fill="var(--color-playCount)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">Aucune donnée</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Listes détaillées Top 15 (existantes) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="flex flex-col overflow-hidden bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800/50 bg-slate-900/50">
                  <CardTitle className="text-xl text-slate-100">Détail Top 15 Artistes</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[350px]">
                    <ul className="divide-y divide-slate-800/50">
                      {stats.topArtists.length > 0 ? (
                        stats.topArtists.map((artist, index) => (
                          <li key={artist.name} className="flex items-center justify-between p-4 transition-colors hover:bg-slate-800/50">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full bg-slate-800 text-slate-400">
                                {index + 1}
                              </span>
                              <span className="font-medium text-slate-200">{artist.name}</span>
                            </div>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-400 hover:bg-green-500/20">
                              {formatHours(artist.msPlayed)} h
                            </Badge>
                          </li>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full p-8 text-slate-500">
                          Aucune donnée
                        </div>
                      )}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="flex flex-col overflow-hidden bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800/50 bg-slate-900/50">
                  <CardTitle className="text-xl text-slate-100">Détail Top 15 Titres</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[350px]">
                    <ul className="divide-y divide-slate-800/50">
                      {stats.topTracks.length > 0 ? (
                        stats.topTracks.map((track, index) => (
                          <li key={`${track.name}-${track.artist}`} className="flex items-center justify-between p-4 transition-colors hover:bg-slate-800/50">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full bg-slate-800 text-slate-400">
                                {index + 1}
                              </span>
                              <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
                                <span className="font-medium text-slate-200 truncate">{track.name}</span>
                                <span className="text-sm text-slate-400 truncate">{track.artist}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                              {track.playCount.toLocaleString('fr-FR')} écoutes
                            </Badge>
                          </li>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full p-8 text-slate-500">
                          Aucune donnée
                        </div>
                      )}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
