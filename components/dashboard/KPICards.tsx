import React from "react";
import { Clock, Music, Users, FileJson } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface KPICardsProps {
  stats: any;
}

export function KPICards({ stats }: KPICardsProps) {
  const formatHours = (ms: number) => {
    return (ms / (1000 * 60 * 60)).toFixed(1);
  };

  return (
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
          <div className="text-4xl font-light tracking-tight text-white">{stats.totalFiles || 0}</div>
        </CardContent>
      </Card>
    </div>
  );
}
