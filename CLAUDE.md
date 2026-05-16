# Strivio — règles projet

Plateforme SaaS où des coachs CrossFit vendent leur programmation à des
athlètes. Web (back-office coach + checkout) + mobile (consultation +
logging). MVP single-coach, archi pensée multi-coachs.

## Stack imposée

- **Monorepo** : Bun workspaces (`apps/*`, `packages/*`).
- **Backend** : Convex (DB + queries/mutations/actions + HTTP routes).
- **Auth** : BetterAuth via `@convex-dev/better-auth` (composant Convex
  first-party, en alpha).
- **Web** : TanStack Start v1 (React + Vite).
- **UI** : Tailwind v4 + shadcn/ui.

Le dossier `apps/mobile` viendra plus tard — ne pas y toucher pour le moment.

## Règles d'outillage

- **Bun = package manager uniquement.** N'utilise pas le runtime Bun pour
  exécuter du code Convex ou TanStack Start. `bun install` et `bun run` OK ;
  `bun <file>` proscrit.
- **Convex CLI = npx.** `npx convex dev`, `npx convex deploy`. Si une
  commande `bunx convex ...` plante, retombe sur `npx`.
- **Versions épinglées** pour tout ce qui est lié à `@convex-dev/better-auth`
  et `better-auth` (alpha). Pas de `^`, pas de `~` sur ces deux paquets et
  leurs deps directes (`convex` inclus).
- **TanStack Start CLI** : `npx @tanstack/cli create` (le vieux
  `create @tanstack/start` est déprécié).
- **shadcn/ui** : laisse le CLI TanStack Start configurer Tailwind v4, puis
  lance `shadcn init` séparément dans `apps/web` — sans l'add-on shadcn du
  CLI TanStack pour éviter les conflits.

## Workflow de dev

- `bun install` à la racine pour tout installer.
- `bun run dev` à la racine pour lancer Convex + web en parallèle.
- `npx convex dev` doit tourner pendant l'édition de code BetterAuth, sinon
  les types générés (`packages/backend/convex/_generated`) ne sont pas à
  jour et le frontend casse.

## Modèle de données

- `users` est géré par BetterAuth (table créée par le composant) et
  étendu avec `role: "athlete" | "coach"` (défaut `"athlete"` à
  l'inscription).
- Le `role` doit être exposé dans la session BetterAuth pour que les loaders
  TanStack Start puissent l'utiliser comme guard côté serveur.
- `programs`, `days`, `blocks` viendront plus tard — préparer la place dans
  `schema.ts` mais ne pas les implémenter pour la phase 0/1.

## Promotion coach

Pas d'UI pour passer un user à coach pour le moment. Une mutation interne
Convex `makeCoach(email)` est exécutée depuis le dashboard Convex.

## Ce qu'il ne faut PAS faire

- Pas d'OAuth pour l'instant — email + password uniquement.
- Pas de `bun:sqlite`, `Bun.serve()`, `Bun.sql`, etc. (le précédent
  CLAUDE.md poussait pour ça — il a été remplacé).
- Pas de `dotenv` — Convex et Vite lisent `.env` nativement.
- Pas de programs/days/blocks tant que la phase 1 n'est pas validée.
