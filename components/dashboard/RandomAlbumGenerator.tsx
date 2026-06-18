import React, { useState } from "react";
import { Shuffle, Disc3, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RandomAlbumGenerator() {
  const [randomAlbum, setRandomAlbum] = useState<any>(null);
  const [isRandomAlbumLoading, setIsRandomAlbumLoading] = useState(false);

  const fetchRandomAlbum = async () => {
    setIsRandomAlbumLoading(true);
    try {
      const res = await fetch("/api/spotify/random-album");
      if (res.ok) {
        const data = await res.json();
        setRandomAlbum(data.album);
      } else {
        console.error("Erreur lors de la récupération de l'album aléatoire");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRandomAlbumLoading(false);
    }
  };

  return (
    <Card className="chart-card opacity-0 bg-transparent border-emerald-500/20 text-neutral-200 rounded-3xl shadow-none relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      <CardHeader className="pt-6 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-light text-white flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-emerald-400" />
            Générateur d'Album Aléatoire
          </CardTitle>
          <CardDescription className="text-neutral-500 font-light">
            Vous ne savez pas quoi écouter ? Piochez un album au hasard dans votre bibliothèque.
          </CardDescription>
        </div>
        <Button 
          onClick={fetchRandomAlbum} 
          disabled={isRandomAlbumLoading}
          className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-medium transition-all duration-300 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.8)]"
        >
          {isRandomAlbumLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Disc3 className="w-4 h-4 mr-2" />}
          Piocher un album
        </Button>
      </CardHeader>
      {randomAlbum && (
        <CardContent className="px-8 pb-8 pt-2">
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-in fade-in zoom-in-95 duration-500">
            {randomAlbum.images?.[0]?.url ? (
              <img src={randomAlbum.images[0].url} alt={randomAlbum.name} className="w-24 h-24 rounded-xl object-cover shadow-lg border border-white/10" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Disc3 className="w-8 h-8 text-neutral-500" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-medium text-white tracking-tight">{randomAlbum.name}</span>
              <span className="text-neutral-400 text-lg">{randomAlbum.artists?.map((a: any) => a.name).join(", ")}</span>
              <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
                <span>{randomAlbum.release_date?.substring(0, 4)}</span>
                <span>•</span>
                <span>{randomAlbum.total_tracks} titres</span>
              </div>
              <a 
                href={randomAlbum.external_urls?.spotify} 
                target="_blank" 
                rel="noreferrer"
                className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
              >
                Écouter sur Spotify →
              </a>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
