import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetailedListsProps {
  stats: any;
  images: {
    artists: Record<string, string>;
    tracks: Record<string, string>;
  };
}

export function DetailedLists({ stats, images }: DetailedListsProps) {
  const formatHours = (ms: number) => {
    return (ms / (1000 * 60 * 60)).toFixed(1);
  };

  return (
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
  );
}
