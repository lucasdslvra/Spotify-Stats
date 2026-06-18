import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Shuffle, Disc3, Loader2, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RandomAlbumGenerator() {
  const [randomAlbum, setRandomAlbum] = useState<any>(null);
  const [isRandomAlbumLoading, setIsRandomAlbumLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchRandomAlbum = async () => {
    setIsRandomAlbumLoading(true);
    try {
      const res = await fetch("/api/spotify/random-album");
      if (res.ok) {
        const data = await res.json();
        setRandomAlbum(data.album);
        setShowModal(true);
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
    <>
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
      </Card>

      {mounted && showModal && randomAlbum && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 p-2 text-white/70 bg-black/40 hover:text-white hover:bg-black/60 rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full aspect-square">
              {randomAlbum.images?.[0]?.url ? (
                <img src={randomAlbum.images[0].url} alt={randomAlbum.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <Disc3 className="w-32 h-32 text-neutral-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center text-center">
                <h3 className="text-3xl font-bold text-white tracking-tight mb-2 line-clamp-2 leading-tight">{randomAlbum.name}</h3>
                <p className="text-xl font-light text-neutral-300 mb-2">{randomAlbum.artists?.map((a: any) => a.name).join(", ")}</p>
                <div className="flex items-center gap-3 mb-8 text-sm text-neutral-400 font-light">
                  <span>{randomAlbum.release_date?.substring(0, 4)}</span>
                  <span>•</span>
                  <span>{randomAlbum.total_tracks} titres</span>
                </div>
                <a 
                  href={randomAlbum.external_urls?.spotify} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-8 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-medium rounded-full transition-all duration-300 shadow-[0_0_20px_-5px_rgba(29,185,84,0.5)] hover:shadow-[0_0_30px_-5px_rgba(29,185,84,0.8)] hover:-translate-y-1 flex items-center gap-2"
                >
                  <Disc3 className="w-5 h-5" />
                  Écouter l'album
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
