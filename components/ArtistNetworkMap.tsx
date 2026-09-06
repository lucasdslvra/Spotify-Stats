"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods, type NodeObject, type LinkObject } from "react-force-graph-2d";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Network } from "lucide-react";

type GraphNode = NodeObject & { id: string; val: number; x?: number; y?: number };
type GraphLink = LinkObject & { value: number };

interface ArtistNetworkMapProps {
  data: {
    nodes: { id: string; val: number }[];
    links: { source: string; target: string; value: number }[];
  };
  images: Record<string, string>;
}

export function ArtistNetworkMap({ data, images }: ArtistNetworkMapProps) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [initialZoom, setInitialZoom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", updateDimensions);
    updateDimensions();
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Compteur uniquement destiné à re-déclencher un rendu quand une image arrive.
  const [, setImagesLoaded] = useState(0);

  // Pre-load images for canvas drawing
  const nodeImages = useMemo(() => {
    const imgs: Record<string, HTMLImageElement> = {};
    data.nodes.forEach(node => {
      if (images[node.id]) {
        const img = new Image();
        img.src = images[node.id];
        img.onload = () => setImagesLoaded(prev => prev + 1);
        imgs[node.id] = img;
      }
    });
    return imgs;
  }, [data.nodes, images]);

  const maxVal = useMemo(() => Math.max(...data.nodes.map(n => n.val), 1), [data.nodes]);

  return (
    <Card className="chart-card bg-transparent border-white/[0.08] rounded-3xl shadow-none overflow-hidden relative col-span-1 lg:col-span-2">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <CardHeader className="pt-8 px-8 relative z-10 pointer-events-none">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/5 rounded-xl border border-white/10">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-light text-white">Toile des Artistes</CardTitle>
            <CardDescription className="text-neutral-500 font-light mt-1">Connexions par featurings et genres musicaux (Top 100 artistes)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className="w-full h-[600px] cursor-grab active:cursor-grabbing bg-black/20">
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={data}
            nodeLabel="id"
            nodeRelSize={6}
            linkColor={() => "rgba(255, 255, 255, 0.15)"}
            linkWidth={(link: LinkObject) => Math.min((link as GraphLink).value, 5)}
            nodeCanvasObject={(node: NodeObject, ctx, globalScale) => {
              const { id, val, x = 0, y = 0 } = node as GraphNode;
              const size = Math.max(12, (val / maxVal) * 40);
              const img = nodeImages[id];

              ctx.save();
              ctx.beginPath();
              ctx.arc(x, y, size / 2, 0, 2 * Math.PI, false);
              ctx.clip();

              if (img && img.complete) {
                ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
              } else {
                ctx.fillStyle = "#1e1e1e";
                ctx.fill();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ffffff";
                const fontSize = size / 3;
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.fillText(id.substring(0, 1), x, y);
              }
              
              ctx.restore();

              // Draw ring
              ctx.beginPath();
              ctx.arc(x, y, size / 2, 0, 2 * Math.PI, false);
              ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
              ctx.lineWidth = 1.5 / globalScale;
              ctx.stroke();

              // Text label
              const label = id;
              const fontSize = 12 / globalScale;
              ctx.font = `300 ${fontSize}px Inter, Sans-Serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
              ctx.fillText(label, x, y + size / 2 + 4 / globalScale);
            }}
            d3VelocityDecay={0.3}
            cooldownTicks={100}
            onEngineStop={() => {
              if (!initialZoom && fgRef.current) {
                fgRef.current.d3Force("charge")?.strength(-300);
                fgRef.current.d3Force("link")?.distance(80);
                fgRef.current.zoom(1.8, 800);
                fgRef.current.centerAt(0, 0, 800);
                setInitialZoom(true);
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
