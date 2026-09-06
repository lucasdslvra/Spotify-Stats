"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] px-6 text-center text-neutral-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
          Une erreur est survenue
        </span>
        <h1 className="text-4xl font-light tracking-tighter text-white sm:text-5xl">
          Quelque chose s&apos;est mal passé
        </h1>
        <p className="max-w-md text-sm font-light text-neutral-500">
          Vos données n&apos;ont pas été perdues : elles ne quittent jamais votre navigateur.
          Réessayez, l&apos;analyse repartira de zéro.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-neutral-700">Référence : {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-2 flex items-center gap-2 rounded-full border border-white/10 px-8 py-3 text-sm font-light text-white transition-colors duration-300 hover:bg-white hover:text-black"
        >
          <RotateCcw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}
