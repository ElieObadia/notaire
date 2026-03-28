# Cahier des Charges Technique
## Dashboard Notaire Immobilier

**Version :** 1.0
**Date :** Mars 2026
**Référence fonctionnelle :** cahier-des-charges-notaire.md v1.0

---

## 1. Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| Langage | TypeScript | 5.x strict |
| Base de données | Supabase (PostgreSQL 15) | — |
| Auth | Supabase Auth | — |
| ORM / Query | Supabase JS Client | 2.x |
| UI Components | shadcn/ui | latest |
| Styles | Tailwind CSS | 3.x |
| Emails | Resend | latest |
| Hébergement | Vercel | — |
| Package manager | pnpm | 8.x+ |

---

## 2. Architecture des fichiers

```
/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Page connexion unique
│   ├── dashboard/
│   │   ├── page.tsx                  # Vue globale dossiers
│   │   ├── [id]/
│   │   │   └── page.tsx              # Détail dossier
│   │   └── nouveau/
│   │       └── page.tsx              # Création dossier
│   └── api/
│       ├── dossiers/
│       │   ├── route.ts              # GET (liste), POST (création)
│       │   └── [id]/
│       │       └── route.ts          # GET, PATCH, DELETE
│       ├── pieces/
│       │   ├── route.ts              # POST (ajout pièce)
│       │   └── [id]/
│       │       └── route.ts          # PATCH (cocher/décocher), DELETE
│       └── rappels/
│           ├── route.ts              # GET (liste), POST (manuel)
│           └── send/
│               └── route.ts          # POST (déclenchement envoi email)
├── components/
│   ├── dossier/
│   │   ├── DossierCard.tsx           # Carte résumé dans la liste
│   │   ├── DossierForm.tsx           # Formulaire création/édition
│   │   ├── PiecesChecklist.tsx       # Liste pièces avec cases à cocher
│   │   ├── PieceRow.tsx              # Ligne individuelle pièce
│   │   ├── DelaisTimeline.tsx        # Timeline des délais légaux
│   │   └── RappelsBadge.tsx          # Badge alertes
│   ├── dashboard/
│   │   ├── AlertesWidget.tsx         # Widget "Actions du jour"
│   │   ├── CalendrierSignatures.tsx  # Vue calendrier mensuel
│   │   └── StatsBanner.tsx           # Compteurs rapides
│   └── ui/                           # Composants shadcn/ui (générés)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # createBrowserClient()
│   │   └── server.ts                 # createServerClient() avec cookies
│   ├── pieces-requises/
│   │   └── index.ts                  # getPiecesRequises(typeActe)
│   ├── rappels/
│   │   └── index.ts                  # getRappels(dossier)
│   ├── dates/
│   │   └── index.ts                  # Utilitaires jours ouvrés, délais légaux
│   └── email/
│       └── templates.ts              # Templates Resend
├── types/
│   └── index.ts                      # Types TypeScript globaux
├── middleware.ts                      # Redirection auth
└── supabase/
    └── migrations/                   # Migrations SQL versionnées
        ├── 0001_create_dossiers.sql
        ├── 0002_create_pieces_dossier.sql
        ├── 0003_create_rappels.sql
        └── 0004_rls_policies.sql
```

---

## 3. Schéma de base de données

### 3.1 Table `dossiers`

```sql
create table dossiers (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  type_acte       text not null,
  date_signature  date not null,
  date_compromis  date,                        -- requis pour certains délais
  statut          text not null default 'en_cours',
  vendeur_nom     text,
  acquereur_nom   text,
  adresse_bien    text,
  prix_vente      numeric(15,2),
  notes           text,
  user_id         uuid references auth.users(id) on delete cascade not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index pour les requêtes fréquentes
create index dossiers_user_id_idx on dossiers(user_id);
create index dossiers_statut_idx on dossiers(statut);
create index dossiers_date_signature_idx on dossiers(date_signature);
```

**Contrainte `type_acte` (check) :**
```sql
alter table dossiers add constraint dossiers_type_acte_check
  check (type_acte in (
    'compromis_vente', 'promesse_vente', 'vente_simple',
    'vefa', 'vente_viager', 'donation_immobiliere',
    'donation_partage', 'succession_immo', 'pret_hypothecaire',
    'mainlevee', 'bail_emphyteotique', 'servitude',
    'etat_descriptif', 'reglement_copropriete'
  ));
```

**Contrainte `statut` (check) :**
```sql
alter table dossiers add constraint dossiers_statut_check
  check (statut in ('en_cours', 'signe', 'archive'));
```

---

### 3.2 Table `pieces_dossier`

```sql
create table pieces_dossier (
  id              uuid primary key default gen_random_uuid(),
  dossier_id      uuid references dossiers(id) on delete cascade not null,
  nom             text not null,
  categorie       text not null,
  obligatoire     boolean not null default true,
  recu            boolean not null default false,
  date_reception  date,
  commentaire     text,
  validite_mois   integer,                     -- null = illimité
  created_at      timestamptz not null default now()
);

create index pieces_dossier_dossier_id_idx on pieces_dossier(dossier_id);
```

**Contrainte `categorie` (check) :**
```sql
alter table pieces_dossier add constraint pieces_dossier_categorie_check
  check (categorie in (
    'vendeur', 'acquereur', 'bien', 'financement',
    'admin', 'succession', 'promoteur'
  ));
```

---

### 3.3 Table `rappels`

```sql
create table rappels (
  id                    uuid primary key default gen_random_uuid(),
  dossier_id            uuid references dossiers(id) on delete cascade not null,
  type_rappel           text not null,
  date_rappel           date not null,
  statut                text not null default 'a_faire',
  envoye                boolean not null default false,
  date_envoi            timestamptz,
  message_personnalise  text,
  created_at            timestamptz not null default now()
);

create index rappels_dossier_id_idx on rappels(dossier_id);
create index rappels_date_rappel_idx on rappels(date_rappel);
```

**Contrainte `type_rappel` (check) :**
```sql
alter table rappels add constraint rappels_type_rappel_check
  check (type_rappel in (
    'purge_dpu_envoi_dia', 'purge_dpu_fin_delai',
    'purge_safer', 'purge_droit_locataire',
    'retractation_sru_fin', 'reflexion_sru_fin',
    'condition_suspensive_pret', 'acceptation_offre_pret',
    'reflexion_vefa', 'declaration_succession',
    'signature_imminente', 'rappel_signature',
    'relance_pieces_manquantes'
  ));
```

**Contrainte `statut` (check) :**
```sql
alter table rappels add constraint rappels_statut_check
  check (statut in (
    'a_faire', 'en_cours', 'alerte', 'critique', 'realise', 'depasse'
  ));
```

---

### 3.4 Trigger `updated_at`

```sql
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dossiers_updated_at
  before update on dossiers
  for each row execute function set_updated_at();
```

---

### 3.5 Row Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
alter table dossiers enable row level security;
alter table pieces_dossier enable row level security;
alter table rappels enable row level security;

-- Politique dossiers : l'utilisateur ne voit que ses propres dossiers
create policy "dossiers: user owns rows"
  on dossiers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Politique pieces_dossier : accès via le dossier parent
create policy "pieces: via dossier owner"
  on pieces_dossier for all
  using (
    exists (
      select 1 from dossiers
      where dossiers.id = pieces_dossier.dossier_id
        and dossiers.user_id = auth.uid()
    )
  );

-- Politique rappels : accès via le dossier parent
create policy "rappels: via dossier owner"
  on rappels for all
  using (
    exists (
      select 1 from dossiers
      where dossiers.id = rappels.dossier_id
        and dossiers.user_id = auth.uid()
    )
  );
```

---

## 4. Types TypeScript

```ts
// types/index.ts

export type TypeActe =
  | 'compromis_vente' | 'promesse_vente' | 'vente_simple'
  | 'vefa' | 'vente_viager' | 'donation_immobiliere'
  | 'donation_partage' | 'succession_immo' | 'pret_hypothecaire'
  | 'mainlevee' | 'bail_emphyteotique' | 'servitude'
  | 'etat_descriptif' | 'reglement_copropriete';

export type StatutDossier = 'en_cours' | 'signe' | 'archive';

export type CategoriePiece =
  | 'vendeur' | 'acquereur' | 'bien' | 'financement'
  | 'admin' | 'succession' | 'promoteur';

export type TypeRappel =
  | 'purge_dpu_envoi_dia' | 'purge_dpu_fin_delai'
  | 'purge_safer' | 'purge_droit_locataire'
  | 'retractation_sru_fin' | 'reflexion_sru_fin'
  | 'condition_suspensive_pret' | 'acceptation_offre_pret'
  | 'reflexion_vefa' | 'declaration_succession'
  | 'signature_imminente' | 'rappel_signature'
  | 'relance_pieces_manquantes';

export type StatutRappel =
  | 'a_faire' | 'en_cours' | 'alerte' | 'critique' | 'realise' | 'depasse';

export interface Dossier {
  id: string;
  reference: string;
  type_acte: TypeActe;
  date_signature: string;       // ISO 8601 YYYY-MM-DD
  date_compromis?: string;
  statut: StatutDossier;
  vendeur_nom?: string;
  acquereur_nom?: string;
  adresse_bien?: string;
  prix_vente?: number;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PieceDossier {
  id: string;
  dossier_id: string;
  nom: string;
  categorie: CategoriePiece;
  obligatoire: boolean;
  recu: boolean;
  date_reception?: string;
  commentaire?: string;
  validite_mois?: number;       // null = illimité
  created_at: string;
}

export interface Rappel {
  id: string;
  dossier_id: string;
  type_rappel: TypeRappel;
  date_rappel: string;
  statut: StatutRappel;
  envoye: boolean;
  date_envoi?: string;
  message_personnalise?: string;
  created_at: string;
}

// Type retourné par getPiecesRequises()
export interface PieceRequise {
  nom: string;
  categorie: CategoriePiece;
  obligatoire: boolean;
  validite_mois?: number;
}
```

---

## 5. Logique métier

### 5.1 `lib/pieces-requises/index.ts`

Signature :
```ts
export function getPiecesRequises(typeActe: TypeActe): PieceRequise[]
```

Chaque type d'acte retourne la concaténation de :
1. **Pièces communes** (identité parties, domicile, RIB)
2. **Pièces spécifiques** au type d'acte (voir cahier des charges fonctionnel §4)

Règle d'implémentation :
- Utiliser un objet de configuration statique par type d'acte, pas de if/else en cascade
- Les pièces communes sont définies une seule fois et spread dans chaque config

---

### 5.2 `lib/rappels/index.ts`

Signature :
```ts
export function getRappels(dossier: Dossier): Omit<Rappel, 'id' | 'envoye' | 'date_envoi' | 'created_at'>[]
```

Règles de calcul par type de rappel :

| Type | Règle | Données requises |
|---|---|---|
| `retractation_sru_fin` | `date_compromis + 11 jours calendaires` (J+1 de présentation LRAR + 10j) | `date_compromis` |
| `purge_dpu_envoi_dia` | Immédiatement après `date_compromis` | `date_compromis` |
| `purge_dpu_fin_delai` | `date_compromis + 65 jours` (alerte à J+60) | `date_compromis` |
| `condition_suspensive_pret` | Saisie manuelle (champ `date_rappel` libre) | — |
| `acceptation_offre_pret` | Saisie manuelle (réception offre + 10j) | — |
| `reflexion_vefa` | `date_envoi_projet_acte + 31 jours` | champ dédié |
| `declaration_succession` | `date_deces + 150 jours` (alerte à J+150, délai légal 6 mois) | champ dédié |
| `signature_imminente` | `date_signature - 7 jours` | `date_signature` |
| `rappel_signature` | `date_signature - 1 jour` | `date_signature` |
| `relance_pieces_manquantes` | `date_signature - 30j`, `- 14j`, `- 7j` | `date_signature` |

---

### 5.3 `lib/dates/index.ts`

```ts
// Ajouter N jours ouvrés (hors week-end, sans jours fériés par défaut)
export function addJoursOuvres(date: Date, jours: number): Date

// Calculer le statut d'un rappel selon la date courante
export function getStatutRappel(dateRappel: string): StatutRappel

// Formater une date ISO pour l'affichage (DD/MM/YYYY)
export function formatDate(isoDate: string): string

// Parser une date d'affichage vers ISO
export function parseDate(displayDate: string): string
```

Règle `getStatutRappel` :
- `depasse` : date < aujourd'hui
- `critique` : 0–2 jours
- `alerte` : 3–7 jours
- `en_cours` : 8–30 jours
- `a_faire` : > 30 jours
- `realise` : marqué manuellement

---

## 6. API Routes

### `GET /api/dossiers`
Retourne la liste des dossiers de l'utilisateur connecté, triés par `date_signature` ASC.

**Query params :**
- `statut` (optionnel) : filtre par statut
- `q` (optionnel) : recherche sur `reference`, `vendeur_nom`, `acquereur_nom`, `adresse_bien`

**Response :**
```ts
{ data: Dossier[], count: number }
```

---

### `POST /api/dossiers`
Crée un dossier, génère et persiste les pièces requises et les rappels calculables.

**Body :**
```ts
{
  reference: string;
  type_acte: TypeActe;
  date_signature: string;
  date_compromis?: string;
  vendeur_nom?: string;
  acquereur_nom?: string;
  adresse_bien?: string;
  prix_vente?: number;
  notes?: string;
}
```

**Logique :**
1. Insérer dans `dossiers`
2. Appeler `getPiecesRequises(type_acte)` → insérer dans `pieces_dossier`
3. Appeler `getRappels(dossier)` → insérer les rappels calculables dans `rappels`
4. Retourner `{ dossier, pieces, rappels }`

---

### `PATCH /api/dossiers/[id]`
Met à jour les champs du dossier. Si `date_signature` ou `date_compromis` change, recalculer et remplacer les rappels existants (hors rappels manuels ou déjà envoyés).

---

### `PATCH /api/pieces/[id]`
Met à jour une pièce (cocher/décocher `recu`, ajouter `commentaire`, `date_reception`).

**Body (partiel) :**
```ts
{
  recu?: boolean;
  date_reception?: string;
  commentaire?: string;
}
```

---

### `POST /api/rappels/send`
Envoie l'email de rappel via Resend et marque `envoye = true`, `date_envoi = now()`.

**Body :**
```ts
{ rappel_id: string }
```

---

## 7. Middleware d'authentification

```ts
// middleware.ts
export async function middleware(request: NextRequest) {
  // Récupérer la session Supabase
  // Si pas de session et route != /login → redirect /login
  // Si session et route == /login → redirect /dashboard
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 8. Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-side uniquement

# Resend
RESEND_API_KEY=
NOTIFICATION_EMAIL_TO=              # email destinataire des rappels

# App
NEXT_PUBLIC_APP_URL=                # ex: https://notaire-dashboard.vercel.app
```

Règles :
- `NEXT_PUBLIC_*` : utilisables côté client
- `SUPABASE_SERVICE_ROLE_KEY` et `RESEND_API_KEY` : server-side uniquement, jamais dans un composant client

---

## 9. Cron Vercel (rappels automatiques)

Fichier `vercel.json` :
```json
{
  "crons": [
    {
      "path": "/api/rappels/send-scheduled",
      "schedule": "0 7 * * 1-5"
    }
  ]
}
```

Route `GET /api/rappels/send-scheduled` :
1. Sécurisée par header `Authorization: Bearer $CRON_SECRET`
2. Récupère tous les rappels dont `date_rappel <= today` et `envoye = false`
3. Pour chaque rappel : envoie l'email via Resend, marque `envoye = true`
4. Retourne `{ sent: number }`

---

## 10. UI — Conventions de style

- **Palette** : `slate` pour le fond/texte neutre, `blue-900` / `blue-700` comme accent principal
- **Statuts visuels** :
  - `a_faire` / `en_cours` → badge gris
  - `alerte` → badge orange (`amber-500`)
  - `critique` → badge rouge (`red-600`)
  - `realise` / `purgé` → badge vert (`green-600`)
  - `depasse` → badge rouge foncé + icône alerte
- **Dates** : toujours affichées `DD/MM/YYYY`, jamais l'ISO brut
- **`"use client"`** uniquement pour : formulaires, cases à cocher, états d'accordéon
- **Server Components** pour toutes les pages de liste et de détail (fetch Supabase côté serveur)

---

## 11. Règles TypeScript

- `tsconfig.json` : `"strict": true`
- Pas de `any` — utiliser `unknown` si le type est indéterminé
- Les valeurs des enums (`TypeActe`, `TypeRappel`, etc.) sont des `string` literals, pas des enums TypeScript (pour la sérialisation JSON sans friction)
- Les dates sont des `string` (ISO 8601) dans les types de données ; les objets `Date` sont utilisés uniquement dans les fonctions de calcul

---

## 12. Tests unitaires requis

Les fonctions suivantes doivent avoir des tests unitaires (Jest ou Vitest) :

| Fonction | Cas à couvrir |
|---|---|
| `getRappels()` | Calcul correct pour chaque type d'acte |
| `addJoursOuvres()` | Passage week-end, début de mois, fin d'année |
| `getStatutRappel()` | Tous les paliers (depasse, critique, alerte, en_cours, a_faire) |
| `getPiecesRequises()` | Chaque type d'acte retourne au minimum les pièces communes |
| Délai rétractation SRU | Jour J tombe samedi → report lundi |
| Déclaration succession | Décès hors France → 12 mois |

---

## 13. Ordre d'implémentation (phases)

### Phase 1 — MVP
1. Init projet Next.js 14 + shadcn/ui + Tailwind
2. Configuration Supabase local + migrations tables
3. Middleware auth + page `/login`
4. `lib/pieces-requises/index.ts` + tests
5. `lib/rappels/index.ts` + `lib/dates/index.ts` + tests
6. Route `POST /api/dossiers` (création + génération automatique)
7. Page `/dashboard` (liste dossiers)
8. Page `/dashboard/nouveau` (formulaire création)
9. Page `/dashboard/[id]` (détail : checklist pièces + timeline délais)
10. `PATCH /api/pieces/[id]` (cocher une pièce)

### Phase 2 — Rappels email
11. Configuration Resend + template email
12. Route `POST /api/rappels/send`
13. Route `GET /api/rappels/send-scheduled` + `vercel.json` cron
14. Historique des rappels dans la page dossier

### Phase 3 — Ergonomie
15. Widget alertes dashboard + calendrier signatures
16. Filtres et recherche liste dossiers
17. Export PDF checklist (react-pdf ou similaire)
18. Commentaires par pièce

---

*Document technique — usage interne — Office notarial · Branche immobilière*
