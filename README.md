# SpotiFiles

Analyse de votre historique d'écoute Spotify : top artistes, top titres, évolution
mensuelle et toile des collaborations entre artistes.

Deux modes complémentaires :

| Mode | Source | Connexion requise |
| --- | --- | --- |
| **Archives** | Fichiers `Streaming_History_Audio_*.json` de l'export Spotify | Non |
| **En direct** | API Web Spotify (top 50 artistes / titres, albums enregistrés) | Oui (OAuth) |

Les archives sont lues **dans le navigateur** : les écoutes ne sont jamais envoyées
au serveur. Seuls les noms d'artistes et de titres transitent par l'API interne,
uniquement pour récupérer les visuels correspondants.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 ·
shadcn/ui · Recharts · react-force-graph-2d · NextAuth v4.

## Développement

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables
npm run dev
```

L'application est disponible sur http://localhost:3000.

### Variables d'environnement

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `SPOTIFY_CLIENT_ID` | oui | Identifiant de l'application Spotify |
| `SPOTIFY_CLIENT_SECRET` | oui | Secret de l'application Spotify |
| `NEXTAUTH_SECRET` | oui en production | Signature des JWT de session (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | hors Vercel | URL canonique du déploiement |
| `NEXT_PUBLIC_SITE_URL` | non | URL publique pour les metadata (Open Graph, sitemap) |

### Application Spotify

Dans le [dashboard développeur Spotify](https://developer.spotify.com/dashboard),
déclarer les URL de redirection :

```
https://<votre-domaine>/api/auth/callback/spotify
http://127.0.0.1:3000/api/auth/callback/spotify
```

Scopes utilisés : `user-read-email`, `user-top-read`, `user-read-recently-played`,
`user-library-read`.

> En mode « development », une application Spotify est limitée à 25 utilisateurs
> déclarés manuellement. Une demande d'extension de quota est nécessaire pour une
> ouverture publique. Spotify interdit par ailleurs d'utiliser sa marque dans le
> nom d'une application tierce.

## Vérifications avant déploiement

```bash
npm run verify   # lint + typecheck + build
```

## Déploiement (Vercel)

1. Importer le dépôt dans Vercel (le framework Next.js est détecté automatiquement).
2. Renseigner les variables d'environnement ci-dessus dans **Settings → Environment
   Variables**, pour les environnements *Production* et *Preview*.
3. Déployer, puis ajouter l'URL de callback du domaine final dans l'application Spotify.

Points déjà configurés pour la production :

- metadata complètes (titre, description, Open Graph, Twitter Card, canonical) ;
- favicon, icône Apple, icônes PWA et `manifest.webmanifest` ;
- image Open Graph générée à la compilation (`app/opengraph-image.tsx`) ;
- `robots.txt` et `sitemap.xml` dynamiques ;
- en-têtes de sécurité (CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`) ;
- pages d'erreur et 404 dédiées ;
- rafraîchissement automatique du token Spotify (valable 1 h) ;
- limitation de débit et bornes sur la route publique `/api/spotify/images`.

## Structure

```
app/                 Routes App Router, metadata, pages d'erreur
  api/auth/          NextAuth (provider Spotify)
  api/spotify/       Routes serveur : stats en direct, visuels, album aléatoire
components/dashboard Blocs du tableau de bord
components/ui        Primitives shadcn/ui
hooks/               Analyse des archives côté navigateur
lib/                 Config du site, auth, types, utilitaires
```

## Personnalisation

Le nom de l'application, la description et les couleurs sont centralisés dans
[`lib/site.ts`](lib/site.ts) : les modifier met à jour l'onglet du navigateur, le
manifest PWA, l'image Open Graph, le sitemap et le titre de la page d'accueil.
