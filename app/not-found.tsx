import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] px-6 text-center text-neutral-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-white/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
          Erreur 404
        </span>
        <h1 className="text-4xl font-light tracking-tighter text-white sm:text-5xl">
          Cette page n&apos;existe pas
        </h1>
        <p className="max-w-md text-sm font-light text-neutral-500">
          Le lien est peut-être obsolète. Revenez à l&apos;accueil pour analyser vos archives
          d&apos;écoute.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full border border-white/10 px-8 py-3 text-sm font-light text-white transition-colors duration-300 hover:bg-white hover:text-black"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
