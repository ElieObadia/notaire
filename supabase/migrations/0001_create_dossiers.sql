-- Migration 0001 : Création de la table dossiers

create table dossiers (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,
  type_acte      text not null,
  date_signature date not null,
  date_compromis date,
  statut         text not null default 'en_cours',
  vendeur_nom    text,
  acquereur_nom  text,
  adresse_bien   text,
  prix_vente     numeric(15,2),
  notes          text,
  user_id        uuid references auth.users(id) on delete cascade not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Index pour les requêtes fréquentes
create index dossiers_user_id_idx       on dossiers(user_id);
create index dossiers_statut_idx        on dossiers(statut);
create index dossiers_date_signature_idx on dossiers(date_signature);

-- Contrainte type_acte
alter table dossiers add constraint dossiers_type_acte_check
  check (type_acte in (
    'compromis_vente', 'promesse_vente', 'vente_simple',
    'vefa', 'vente_viager', 'donation_immobiliere',
    'donation_partage', 'succession_immo', 'pret_hypothecaire',
    'mainlevee', 'bail_emphyteotique', 'servitude',
    'etat_descriptif', 'reglement_copropriete'
  ));

-- Contrainte statut
alter table dossiers add constraint dossiers_statut_check
  check (statut in ('en_cours', 'signe', 'archive'));
