# CLAUDE.md — Dashboard Notaire Immobilier

## Vue d'ensemble du projet

Application web de suivi de dossiers immobiliers pour une collaboratrice notaire.
L'outil centralise le suivi des actes (vente, achat, etc.), les pièces justificatives requises,
et les rappels automatiques de dates clés (purge, signature, etc.).

**Stack :**
- Frontend + API Routes : Next.js 14 (App Router) — déployé sur Vercel
- Base de données : Supabase (PostgreSQL + Auth + Realtime)
- Auth : Supabase Auth, un seul compte utilisateur (session unique)
- Notifications : Resend (emails) ou Supabase Edge Functions + cron

---

## Architecture des dossiers

```
/
├── app/
│   ├── (auth)/
│   │   └── login/           # Page de connexion unique
│   ├── dashboard/
│   │   ├── page.tsx          # Vue globale des dossiers
│   │   ├── [id]/
│   │   │   └── page.tsx      # Détail d'un dossier
│   │   └── nouveau/
│   │       └── page.tsx      # Création de dossier
│   └── api/
│       ├── dossiers/         # CRUD dossiers
│       ├── pieces/           # Gestion des pièces requises
│       └── rappels/          # Déclenchement des rappels
├── components/
│   ├── dossier/
│   │   ├── DossierCard.tsx
│   │   ├── DossierForm.tsx
│   │   ├── PiecesChecklist.tsx
│   │   └── TimelineRappels.tsx
│   └── ui/                   # Composants génériques (shadcn/ui)
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Client browser
│   │   └── server.ts         # Client server-side
│   ├── pieces-requises/
│   │   └── index.ts          # Logique métier : pièces selon type d'acte
│   └── rappels/
│       └── index.ts          # Calcul des dates de rappel
├── types/
│   └── index.ts              # Types TypeScript globaux
└── supabase/
    └── migrations/           # Migrations SQL
```

---

## Schéma de base de données (Supabase)

### Table `dossiers`

```sql
create table dossiers (
  id uuid primary key default gen_random_uuid(),
  reference text not null,                    -- ex: "2024-VTE-042"
  type_acte text not null,                    -- voir enum ci-dessous
  date_signature date not null,
  statut text default 'en_cours',             -- en_cours | signe | archive
  vendeur_nom text,
  acquereur_nom text,
  adresse_bien text,
  prix_vente numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Valeurs `type_acte` :**
- `vente_simple`
- `vente_viager`
- `vente_en_letat_futur_achevement` (VEFA)
- `donation`
- `succession`
- `pret_immobilier`
- `bail_emphyteotique`
- `promesse_vente`
- `compromis_vente`

---

### Table `pieces_dossier`

```sql
create table pieces_dossier (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references dossiers(id) on delete cascade,
  nom text not null,                          -- ex: "Titre de propriété"
  categorie text not null,                    -- vendeur | acquereur | bien | financement | admin
  obligatoire boolean default true,
  recu boolean default false,
  date_reception date,
  commentaire text,
  created_at timestamptz default now()
);
```

---

### Table `rappels`

```sql
create table rappels (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references dossiers(id) on delete cascade,
  type_rappel text not null,                  -- voir enum ci-dessous
  date_rappel date not null,
  envoye boolean default false,
  date_envoi timestamptz,
  message_personnalise text,
  created_at timestamptz default now()
);
```

**Valeurs `type_rappel` :**
- `purge_droit_preemption`         — J-10 avant signature (DPU)
- `delai_retractation`             — 10 jours après compromis
- `condition_suspensive_pret`      — date limite obtention prêt
- `relance_pieces_manquantes`      — configurable
- `signature_imminente`            — J-7 avant date_signature
- `rappel_signature`               — J-1 avant date_signature

---

## Logique métier : pièces requises par type d'acte

Le fichier `lib/pieces-requises/index.ts` expose une fonction :

```ts
getPiecesRequises(typeActe: TypeActe): PieceRequise[]
```

### Pièces communes à tous les actes

**Vendeur / Donateur :**
- Carte d'identité ou passeport (+ livret de famille si marié)
- Justificatif de domicile < 3 mois
- Titre de propriété
- Relevé de situation hypothécaire (état hypothécaire)
- Diagnostics techniques obligatoires (DPE, amiante, plomb, etc.)
- Taxe foncière dernière année
- Procès-verbal d'assemblée générale (si copropriété, 3 derniers PV)
- Règlement de copropriété + modificatifs
- Fiche synthétique de copropriété

**Acquéreur :**
- Carte d'identité ou passeport
- Justificatif de domicile < 3 mois
- Justificatif de situation familiale (livret de famille, PACS, etc.)

---

### Pièces spécifiques par type

#### `vente_simple` / `compromis_vente` / `promesse_vente`
- Offre d'achat acceptée
- Attestation de financement ou accord de principe bancaire
- Certificat urbanisme (CU opérationnel ou informatif)
- État des risques et pollutions (ERP) < 6 mois
- Mesurage loi Carrez (si copropriété)
- Dernier appel de charges copropriété

#### `vente_en_letat_futur_achevement` (VEFA)
- Permis de construire et pièces annexées
- Garantie financière d'achèvement (GFA)
- Notice descriptive
- Plans du bien
- Attestation d'assurance dommages-ouvrage

#### `pret_immobilier`
- Offre de prêt (délai légal 10 jours avant signature)
- Tableau d'amortissement
- Attestation assurance emprunteur
- Fiche d'information standardisée européenne (FISE)

#### `donation`
- Acte de naissance donateur et donataire
- Justificatif du lien de parenté
- Déclaration de don manuel (si applicable)
- Attestation valeur du bien (expertise)

#### `succession`
- Acte de décès
- Acte de naissance du défunt
- Livret de famille du défunt
- Testament (si existant)
- Certificat d'hérédité ou attestation notariée
- Déclaration de succession (formulaire fiscal 2705)
- État de l'actif successoral complet

#### `bail_emphyteotique`
- Bail emphytéotique existant (si renouvellement)
- Attestation d'assurance
- Justificatif d'affectation du bien

#### `vente_viager`
- Rapport d'expertise pour calcul de la rente
- Certificat médical du crédirentier (< 3 mois)
- Tableau de calcul rente viagère
- Attestation d'assurance décès

---

## Calcul des dates de rappel

```ts
// lib/rappels/index.ts
getRappels(dossier: Dossier): Rappel[]
```

| Type de rappel | Règle de calcul |
|---|---|
| `purge_droit_preemption` | `date_signature - 10 jours ouvrés` |
| `delai_retractation` | `date_compromis + 10 jours calendaires` |
| `condition_suspensive_pret` | Champ libre, saisi manuellement |
| `signature_imminente` | `date_signature - 7 jours` |
| `rappel_signature` | `date_signature - 1 jour` |
| `relance_pieces_manquantes` | Configurable (défaut : J-30, J-14, J-7) |

---

## Règles de développement

### Général
- Toujours utiliser TypeScript strict
- Toutes les dates en ISO 8601 (`YYYY-MM-DD`) côté base, formatées `DD/MM/YYYY` côté UI
- Les calculs de dates métier (jours ouvrés, délais légaux) doivent être testés unitairement

### Next.js
- Utiliser exclusivement l'App Router (pas de `pages/`)
- Les Server Components par défaut, `"use client"` uniquement quand nécessaire
- Les appels Supabase côté serveur via `lib/supabase/server.ts` (cookies)
- Les appels côté client via `lib/supabase/client.ts`

### Supabase
- Activer Row Level Security (RLS) sur toutes les tables
- Politique RLS : seul l'utilisateur authentifié peut lire/écrire ses données
- Utiliser les migrations versionnées dans `/supabase/migrations/`
- Ne jamais exposer la `service_role` key côté client

### Auth
- Un seul compte utilisateur : créé manuellement dans Supabase Auth
- Redirection automatique vers `/dashboard` si session active
- Redirection vers `/login` si pas de session (middleware Next.js)
- Pas d'inscription publique (désactiver dans Supabase Dashboard)

### UI
- Utiliser shadcn/ui comme base de composants
- Tailwind CSS pour le style
- Palette : tons neutres professionnels (slate, zinc) avec accent bleu marine
- Mobile-first mais optimisé desktop (l'outil est utilisé sur ordinateur)

---

## Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side uniquement, jamais exposé

# Notifications (Resend)
RESEND_API_KEY=
NOTIFICATION_EMAIL_TO=          # email de la collaboratrice

# App
NEXT_PUBLIC_APP_URL=            # ex: https://notaire-dashboard.vercel.app
```

---

## Fonctionnalités à implémenter (ordre de priorité)

### P0 — MVP
1. Authentification unique (login / logout)
2. Liste des dossiers avec statut et date de signature
3. Création d'un dossier (type d'acte + date signature + parties)
4. Génération automatique de la checklist de pièces selon le type d'acte
5. Cochage des pièces reçues

### P1 — Rappels
6. Calcul et affichage des dates de rappel sur le dossier
7. Envoi d'email de rappel (via Resend + Vercel Cron)
8. Marquage "rappel envoyé"

### P2 — Ergonomie
9. Tableau de bord avec vue calendrier des signatures à venir
10. Filtres et recherche sur la liste des dossiers
11. Export PDF de la checklist d'un dossier
12. Commentaires / notes par pièce

---

## Commandes utiles

```bash
# Développement
pnpm dev

# Supabase local
supabase start
supabase db reset
supabase migration new <nom>

# Déploiement
vercel --prod
```

---

## Références légales importantes

- **Délai de rétractation SRU** : 10 jours calendaires (art. L.271-1 CCH)
- **Purge DPU (Droit de Préemption Urbain)** : notification obligatoire en mairie, délai de 2 mois pour exercer (courant à surveiller)
- **Délai offre de prêt** : 10 jours minimum avant acceptation (art. L.313-34 CMF)
- **Diagnostics obligatoires** : DPE, amiante, plomb, termites (selon zone), ERP, état de l'installation électrique/gaz (selon âge), mesurage Carrez

> ⚠️ Ces règles sont indicatives. La collaboratrice reste seule responsable de la conformité juridique des dossiers.
