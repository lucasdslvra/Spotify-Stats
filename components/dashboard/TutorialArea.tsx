import React from "react";
import { Database, Clock, Mail, UploadCloud } from "lucide-react";

export function TutorialArea() {
  return (
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
  );
}
