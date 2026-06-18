"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Clock, Music, Users, FileJson, Loader2 } from "lucide-react";
import { useSpotifyData } from "@/hooks/useSpotifyData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function SpotifyDashboard() {
  const { processFiles, stats, isProcessing, error } = useSpotifyData();
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
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-green-500/30">
      <main className="container max-w-6xl px-6 py-12 mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
            Spotify <span className="text-green-500">Extended</span> Stats
          </h1>
          <p className="text-lg text-slate-400">
            Analysez en profondeur votre historique d'écoute à partir des données étendues de Spotify.
          </p>
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

        {/* Dashboard */}
        {stats && !isProcessing && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* KPIs */}
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

            {/* Ranking Matrices */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top Artists */}
              <Card className="flex flex-col overflow-hidden bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800/50 bg-slate-900/50">
                  <CardTitle className="text-xl text-slate-100">Top 15 Artistes</CardTitle>
                  <CardDescription className="text-slate-400">Classement par volume horaire d'écoute</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[450px]">
                    <ul className="divide-y divide-slate-800/50">
                      {stats.topArtists.map((artist, index) => (
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
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Tracks */}
              <Card className="flex flex-col overflow-hidden bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800/50 bg-slate-900/50">
                  <CardTitle className="text-xl text-slate-100">Top 15 Titres</CardTitle>
                  <CardDescription className="text-slate-400">Classement par nombre de lectures</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[450px]">
                    <ul className="divide-y divide-slate-800/50">
                      {stats.topTracks.map((track, index) => (
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
                      ))}
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
