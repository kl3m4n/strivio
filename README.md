# Strivio

Plateforme SaaS de programmation CrossFit pour coachs et athlètes. Phase 0/1
en cours : back-office coach + login. Mobile (consultation + logging) plus
tard.

## Stack

- **Monorepo** : Bun workspaces (`apps/*`, `packages/*`)
- **Backend** : Convex (DB + functions + HTTP routes)
- **Auth** : BetterAuth via `@convex-dev/better-auth` (email + password)
- **Web** : TanStack Start v1 (React + Vite) + Tailwind v4 + shadcn/ui

## Structure

```
strivio/
├── apps/
│   └── web/              # TanStack Start (port 3000)
├── packages/
│   ├── backend/          # Convex (functions + schema + auth)
│   └── shared/           # types partagés
├── package.json          # workspaces root
└── CLAUDE.md             # règles projet
```

## Prérequis

- [Bun](https://bun.sh) ≥ 1.3
- Node ≥ 20 (le CLI Convex tourne en Node, lance-le via `npx`)
- Un compte Convex (gratuit) — `npx convex dev` te guidera, ou `npx convex
  dev --local` si tu veux du 100% local sans cloud

## Installation

```bash
bun install
```

## Premier démarrage

Trois étapes pour avoir l'app utilisable en local.

### 1. Démarre Convex (dans `packages/backend`)

```bash
cd packages/backend
npx convex dev
```

Au premier lancement :
- Convex te demande de te logger (navigateur) et de créer/sélectionner un
  projet.
- Il écrit `packages/backend/.env.local` avec `CONVEX_DEPLOYMENT` et
  `CONVEX_URL`.
- Il génère `packages/backend/convex/_generated/` (types Convex — c'est ce
  qui débloque le typecheck du backend).
- Il pousse le schema, les HTTP routes et le composant BetterAuth.

**Laisse cette commande tourner** — elle watch et hot-reload Convex.

### 2. Set les variables d'env côté Convex

Dans un autre onglet du terminal :

```bash
cd packages/backend
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -hex 32)"
npx convex env set SITE_URL http://localhost:3000
```

### 3. Crée `apps/web/.env.local`

Récupère l'URL Convex (affichée par `convex dev`) et écris :

```bash
# depuis la racine du repo
CONVEX_URL=$(grep -E '^CONVEX_URL=' packages/backend/.env.local | cut -d= -f2- | tr -d '"')
# .convex.cloud → .convex.site (cloud)
# :3210 → :3211 (local)
SITE_URL=$(echo "$CONVEX_URL" | sed -e 's/\.convex\.cloud/.convex.site/' -e 's/:3210/:3211/')
cat > apps/web/.env.local <<EOF
VITE_CONVEX_URL=$CONVEX_URL
VITE_CONVEX_SITE_URL=$SITE_URL
EOF
```

### 4. Démarre le web

```bash
# depuis la racine
bun run dev:web
```

Ouvre http://localhost:3000.

### Tout lancer en une commande

```bash
bun run dev
```

Lance Convex et le web en parallèle (utilise `bun --filter` sur tous les
workspaces qui ont un script `dev`).

## Créer ton premier compte coach + ta programmation

Il n'y a **pas** de page d'inscription dans le MVP. Tu crées le tout depuis
le dashboard Convex :

1. Ouvre le dashboard Convex (mode local : l'URL est dans l'output de
   `npx convex dev`, souvent http://127.0.0.1:6790).
2. Onglet **Functions** → **users** → **seedFirstCoach**.
3. Lance avec :
   ```json
   {
     "email": "you@example.com",
     "password": "supersecret123",
     "name": "Ton nom",
     "organizationName": "HWPO",
     "organizationSlug": "hwpo"
   }
   ```
   Ça crée :
   - le user BetterAuth (avec hash du password),
   - une `organization` (= une *programmation*),
   - un `member` qui te lie à l'org en `role: "owner"`.
4. Va sur http://localhost:3000/login et connecte-toi.
5. Tu atterris sur `/dashboard` ("Bienvenue, coach Ton nom").

### Ajouter un coach à une programmation existante

```
internal.users.addCoachToOrganization({
  email: "coach2@example.com",
  organizationSlug: "hwpo"
})
```

Le user doit déjà exister côté BetterAuth (compte créé via signUp, à terme
via la future page d'invitation). La mutation crée le `member` avec
`role: "coach"`.

## Scripts disponibles (racine)

| Commande | Effet |
|---|---|
| `bun install` | Installe toutes les deps |
| `bun run dev` | Lance Convex + web en parallèle |
| `bun run dev:web` | Lance uniquement le web (port 3000) |
| `bun run dev:backend` | Lance uniquement `npx convex dev` |
| `bun run typecheck` | `tsc --noEmit` sur tous les workspaces |
| `bun run build` | Build de tous les workspaces |

## Variables d'env

### Côté Convex (set via `npx convex env set ...`)

| Var | Effet |
|---|---|
| `BETTER_AUTH_SECRET` | Secret pour signer les sessions BetterAuth (`openssl rand -hex 32`) |
| `SITE_URL` | URL publique du web app (dev : `http://localhost:3000`) |

### Côté web (`apps/web/.env.local`)

| Var | Effet |
|---|---|
| `VITE_CONVEX_URL` | URL Convex cloud (`.convex.cloud`) ou local (`http://127.0.0.1:3210`) |
| `VITE_CONVEX_SITE_URL` | URL Convex HTTP routes (`.convex.site` ou `:3211` en local) |

## Pièges connus

- **`@convex-dev/better-auth` est en alpha** — les versions sont épinglées
  exactement dans `package.json`. Ne mets pas de `^`.
- **Bun ≠ runtime ici.** Bun sert au package management uniquement. Les CLIs
  (Convex, TanStack) tournent via `npx`. Ne lance pas Convex avec `bun`.
- **Tant que `npx convex dev` n'a pas tourné une fois**,
  `packages/backend/convex/_generated/` n'existe pas et `bun run typecheck`
  du backend échoue. C'est normal.
- **Le `role` n'est pas en SSR.** Le guard `/dashboard` est client-only
  (`ssr: false`) car la session BetterAuth est lue côté navigateur. Pour
  faire du guard SSR, il faudra wirer `convexBetterAuthReactStart` (TODO).
