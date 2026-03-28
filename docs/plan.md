# Plan d'actions — Dashboard Notaire Immobilier

**Version :** 1.0
**Date :** Mars 2026
**Référence :** cahier-des-charges-notaire.md + cahier-des-charges-technique.md

---

## Phase 1 — MVP

### Tâche 1 — Init projet Next.js 14 + shadcn/ui + Tailwind CSS ✅ DONE

- `pnpm create next-app@14` avec TypeScript strict, App Router, Tailwind CSS
- Installer et configurer shadcn/ui (`pnpm dlx shadcn@latest init --defaults`)
- Ajout composants shadcn : Button, Card, Badge, Dialog, Input, Label, Select, Textarea, Checkbox, Table, Tabs
- `tsconfig.json` : `"strict": true` (par défaut)
- `tailwind.config.ts` : palette slate + couleurs brand (blue-900/blue-700)
- `types/index.ts` : TypeActe, StatutDossier, CategoriePiece, TypeRappel, StatutRappel, Dossier, PieceDossier, Rappel, PieceRequise
- Structure de dossiers créée : `/app`, `/components/dossier`, `/components/dashboard`, `/lib/supabase`, `/lib/pieces-requises`, `/lib/rappels`, `/lib/dates`, `/lib/email`, `/supabase/migrations`, `/__tests__`
- `.env.local` créé avec variables documentées (SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, RESEND_API_KEY, NOTIFICATION_EMAIL_TO, APP_URL, CRON_SECRET)

---

### Tâche 2 — Configuration Supabase + migrations SQL ✅ DONE

- Créer le projet Supabase (dashboard ou CLI)
- Initialiser Supabase CLI localement : `supabase init`
- Créer les migrations versionnées dans `/supabase/migrations/` :
  - `0001_create_dossiers.sql` — table dossiers + index + contraintes check type_acte + statut
  - `0002_create_pieces_dossier.sql` — table pieces_dossier + index + contrainte categorie
  - `0003_create_rappels.sql` — table rappels + index + contraintes type_rappel + statut
  - `0004_rls_policies.sql` — activer RLS sur les 3 tables + politiques (user owns rows, via dossier owner)
  - `0005_triggers.sql` — trigger updated_at sur dossiers
- Créer `lib/supabase/client.ts` (createBrowserClient) et `lib/supabase/server.ts` (createServerClient avec cookies Next.js)
- Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`
- Désactiver l'inscription publique dans le dashboard Supabase

---

### Tâche 3 — Middleware auth + page /login ✅ DONE

- Créer `middleware.ts` à la racine :
  - Récupérer la session Supabase via `createServerClient`
  - Si pas de session et route !== /login → redirect /login
  - Si session active et route == /login → redirect /dashboard
  - Matcher : toutes les routes sauf `_next/static`, `_next/image`, `favicon.ico`
- Créer `app/(auth)/login/page.tsx` :
  - Formulaire email + mot de passe (Server Action ou client avec `supabase.auth.signInWithPassword`)
  - Affichage des erreurs de connexion
  - Style sobre avec palette slate/blue-900
  - Pas de lien d'inscription
- Créer le compte utilisateur unique dans le dashboard Supabase Auth

---

### Tâche 4 — lib/pieces-requises/index.ts + tests unitaires ✅ DONE

Fichier `lib/pieces-requises/index.ts` :
- Exporter `getPiecesRequises(typeActe: TypeActe): PieceRequise[]`
- Pièces communes (identité, domicile, RIB) définies une fois, spread dans chaque config
- Config statique par type d'acte (pas de if/else en cascade) :
  - **compromis_vente / promesse_vente / vente_simple** : titre propriété, diagnostics DDT (DPE 10 ans, CREP, amiante, ERP 6 mois, élec 3 ans, gaz 3 ans, Carrez illimité), docs copropriété ALUR, CU, état hypothécaire, accord financement acquéreur
  - **vefa** : permis construire, GFA, DO, plans, notice descriptive, état descriptif division, RT2012/RE2020
  - **pret_hypothecaire** : offre prêt, tableau amortissement, FISE, assurance emprunteur, délégation banque
  - **donation_immobiliere / donation_partage** : titre propriété, expertise valeur, acte naissance donataire, justificatif lien parenté
  - **succession_immo** : acte décès, actes état civil, testament, relevés bancaires, titres propriété, formulaire 2705
  - **vente_viager** : rapport expertise, tableau rente viagère, certificat médical < 3 mois, attestation assurance décès
  - **mainlevee** : acte prêt origine, attestation remboursement, accord mainlevée banque
  - **bail_emphyteotique** : titre propriété, bail en vigueur si renouvellement, attestation affectation
- Inclure `validite_mois` pour les diagnostics : DPE (120), ERP (6), termites (6), élec (36), gaz (36)

Tests unitaires Vitest dans `__tests__/pieces-requises.test.ts` :
- Chaque type d'acte retourne au minimum les pièces communes
- Vérifier la présence des pièces spécifiques par type
- Aucun doublon dans les pièces retournées

---

### Tâche 5 — lib/rappels/index.ts + lib/dates/index.ts + tests unitaires ✅ DONE

Fichier `lib/dates/index.ts` :
- `addJoursOuvres(date: Date, jours: number): Date` — hors week-end (sans jours fériés par défaut)
- `getStatutRappel(dateRappel: string): StatutRappel` :
  - `depasse` : date < aujourd'hui
  - `critique` : 0–2 jours
  - `alerte` : 3–7 jours
  - `en_cours` : 8–30 jours
  - `a_faire` : > 30 jours
- `formatDate(isoDate: string): string` → DD/MM/YYYY
- `parseDate(displayDate: string): string` → YYYY-MM-DD

Fichier `lib/rappels/index.ts` :
- `getRappels(dossier: Dossier): Omit<Rappel, 'id' | 'envoye' | 'date_envoi' | 'created_at'>[]`
- Règles de calcul :

| Type de rappel | Règle |
|---|---|
| `retractation_sru_fin` | `date_compromis + 11j` calendaires |
| `purge_dpu_envoi_dia` | Lendemain de `date_compromis` |
| `purge_dpu_fin_delai` | `date_compromis + 65j` (alerte à J+60) |
| `signature_imminente` | `date_signature - 7j` |
| `rappel_signature` | `date_signature - 1j` |
| `relance_pieces_manquantes` | `date_signature - 30j`, `-14j`, `-7j` |
| `reflexion_vefa` | Si type == vefa (champ manuel) |
| `declaration_succession` | `date_deces + 150j` si type == succession_immo |

Tests unitaires Vitest dans `__tests__/rappels.test.ts` et `__tests__/dates.test.ts` :
- `addJoursOuvres` : passage week-end, début/fin de mois
- `getStatutRappel` : tous les paliers
- `getRappels` : calcul correct pour compromis_vente, succession_immo, vefa
- Rétractation SRU : J10 tombe samedi → report lundi
- Succession : délai 6 mois (France) vs 12 mois (hors France)

---

### Tâche 6 — API Routes CRUD dossiers & pièces ✅ DONE

`app/api/dossiers/route.ts` :
- **GET** : liste des dossiers triés par `date_signature ASC`
  - Query params : `statut` (filtre), `q` (recherche sur reference, vendeur_nom, acquereur_nom, adresse_bien)
  - Response : `{ data: Dossier[], count: number }`
- **POST** : création d'un dossier complet
  - Valider le body (reference, type_acte, date_signature obligatoires)
  - Insérer dans `dossiers` avec `user_id = auth.uid()`
  - `getPiecesRequises(type_acte)` → bulk insert dans `pieces_dossier`
  - `getRappels(dossier)` → bulk insert dans `rappels`
  - Response : `{ dossier, pieces, rappels }`

`app/api/dossiers/[id]/route.ts` :
- **GET** : dossier + pièces + rappels
- **PATCH** : màj champs ; si `date_signature` ou `date_compromis` change → recalculer et remplacer les rappels non envoyés
- **DELETE** : suppression (cascade automatique)

`app/api/pieces/[id]/route.ts` :
- **PATCH** : `{ recu?, date_reception?, commentaire? }`

Toutes les routes : vérifier session Supabase (401 si non authentifié), utiliser `lib/supabase/server.ts`.

---

### Tâche 7 — Page /dashboard — liste des dossiers ✅ DONE

`app/dashboard/page.tsx` (Server Component) :
- Fetch des dossiers côté serveur avec count pièces manquantes et prochain délai critique
- En-tête : "Mes dossiers" + bouton "Nouveau dossier" + bouton déconnexion

Composant `components/dossier/DossierCard.tsx` :
- Référence + type d'acte (libellé lisible)
- Parties (vendeur → acquéreur, adapté au type)
- Adresse du bien + date de signature (DD/MM/YYYY)
- Badge statut : `en_cours` (gris), `signe` (vert), `archive` (slate)
- Badge urgence coloré selon prochain délai (vert / orange / rouge)
- Nombre de pièces manquantes
- Lien vers `/dashboard/[id]`

Tri par `date_signature ASC` par défaut, dossiers signés/archivés atténués visuellement.

---

### Tâche 8 — Page /dashboard/nouveau — formulaire création dossier ✅ DONE

`app/dashboard/nouveau/page.tsx` + composant `components/dossier/DossierForm.tsx` ("use client") :

Champs :
- Référence interne (texte, ex: 2026-VTE-042)
- Type d'acte (Select, 14 options en français)
- Date de signature prévue (DD/MM/YYYY)
- Date de compromis (optionnel, visible si type = compromis_vente, promesse_vente, vente_simple, vefa)
- Vendeur / Donateur / Défunt (label adapté au type d'acte)
- Acquéreur / Donataire / Héritiers
- Adresse du bien
- Prix / valeur estimée (formaté en euros)
- Notes libres (textarea)

Comportement :
- Validation côté client avant soumission
- Submit → `POST /api/dossiers` → redirect vers `/dashboard/[newId]`
- Bouton "Annuler" → retour `/dashboard`
- Layout 2 colonnes desktop, 1 colonne mobile

---

### Tâche 9 — Page /dashboard/[id] — détail dossier ✅ DONE

`app/dashboard/[id]/page.tsx` (Server Component) :
- En-tête : référence, type, statut, date signature, parties, adresse
- Bouton "Modifier" + dropdown "Changer statut" (en_cours / signe / archive)
- Tabs : **Pièces justificatives** | **Délais & Rappels**

Composant `components/dossier/PiecesChecklist.tsx` ("use client") :
- Barre de progression X/Y pièces (%)
- Filtres : Toutes / Manquantes / Par catégorie
- Via `components/dossier/PieceRow.tsx` :
  - Checkbox "Reçue" → `PATCH /api/pieces/[id]` (optimistic update)
  - Nom + badge catégorie + badge Obligatoire/Optionnel
  - Date de réception + validité restante (diagnostics)
  - Champ commentaire inline

Composant `components/dossier/DelaisTimeline.tsx` :
- Tableau : Type de délai | Date calculée | Statut | Action
- Badge coloré : `a_faire` (gris), `alerte` (amber-500), `critique` (red-600), `realise` (green-600), `depasse` (red foncé + icône)
- Bouton "Marquer réalisé" pour les rappels manuels

---

## Phase 2 — Rappels email

### Tâche 10 — Resend + templates email + cron Vercel ✅ DONE

Fichier `lib/email/templates.ts` :
- Template HTML pour chaque `TypeRappel` (sujet + corps)
- Inclure : référence dossier, type délai, date, lien vers le dossier
- Champ `message_personnalise` prioritaire si renseigné

Route `app/api/rappels/send/route.ts` (POST) :
- Body : `{ rappel_id: string }`
- Vérifier session + ownership
- Envoyer via Resend SDK
- Marquer `envoye = true`, `date_envoi = now()`, `statut = 'realise'`

Route `app/api/rappels/send-scheduled/route.ts` (GET) :
- Sécurisée par `Authorization: Bearer $CRON_SECRET`
- Récupère tous les rappels `date_rappel <= today` ET `envoye = false`
- Envoie chaque email + marque envoyé
- Response : `{ sent: number }`

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

Historique dans `/dashboard/[id]` : section "Rappels envoyés" (date, type, destinataire).

---

## Phase 3 — Ergonomie

### Tâche 11 — Widget alertes + calendrier signatures ✅ DONE

Composant `components/dashboard/StatsBanner.tsx` :
- Compteurs : Dossiers en cours | Signatures ce mois | Pièces manquantes totales | Alertes actives

Composant `components/dashboard/AlertesWidget.tsx` :
- Rappels urgents du jour et des 7 prochains jours, tous dossiers confondus
- Groupés par jour, triés par criticité
- Badge "Critique" rouge si statut = critique ou depasse

Composant `components/dashboard/CalendrierSignatures.tsx` :
- Vue calendrier mensuel (lundi en premier)
- Badge coloré par jour selon urgence du dossier
- Navigation mois précédent/suivant
- Légende des couleurs d'urgence

Intégration dans `app/dashboard/page.tsx` : StatsBanner en haut, AlertesWidget + CalendrierSignatures en dessous (2 colonnes desktop), puis grille dossiers.

---

### Tâche 12 — Filtres, recherche et export PDF checklist ✅ DONE

Recherche et filtres sur la liste (`app/dashboard/page.tsx`) :
- Composant `components/dashboard/FiltresDossiers.tsx` ("use client") + Suspense dans le Server Component
- Barre de recherche : `reference`, `vendeur_nom`, `acquereur_nom`, `adresse_bien` (via `.or(ilike)` Supabase)
- Filtres : statut (`eq`), type d'acte (`eq`), mois de signature (range `gte`/`lt`)
- Tri : date signature (Supabase order), référence (Supabase order), pièces manquantes (tri JS post-fetch)
- URL persistante : `useSearchParams` + `router.push` + lecture `searchParams` côté serveur
- Bouton "Réinitialiser" visible si filtres actifs

Export PDF checklist :
- Composant `components/dossier/ExportPdfButton.tsx` ("use client"), ajouté dans le header de `/dashboard/[id]`
- Librairie : `jspdf` (import dynamique pour éviter les problèmes SSR)
- Contenu : en-tête bleu navy (référence, type acte, date génération), infos dossier, pièces groupées par catégorie avec cases cochées, section délais légaux colorée selon statut, footer pagination
- Nom fichier : `checklist-[reference]-YYYY-MM-DD.pdf`
- Génération 100 % client-side

Commentaires par pièce :
- Sauvegarde automatique avec debounce 500 ms → `PATCH /api/pieces/[id]` (déjà implémenté dans `PieceRow.tsx` tâche 9)

---

## Récapitulatif

| Phase | Tâches | Priorité |
|---|---|---|
| 1 — MVP | 1 à 9 | P0 |
| 2 — Rappels email | 10 | P1 |
| 3 — Ergonomie | 11 à 12 | P2 |

**Ordre d'implémentation recommandé :** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
