-- Migration 0002 : Création de la table pieces_dossier

create table pieces_dossier (
  id             uuid primary key default gen_random_uuid(),
  dossier_id     uuid references dossiers(id) on delete cascade not null,
  nom            text not null,
  categorie      text not null,
  obligatoire    boolean not null default true,
  recu           boolean not null default false,
  date_reception date,
  commentaire    text,
  validite_mois  integer,                     -- null = illimité
  created_at     timestamptz not null default now()
);

create index pieces_dossier_dossier_id_idx on pieces_dossier(dossier_id);

-- Contrainte categorie
alter table pieces_dossier add constraint pieces_dossier_categorie_check
  check (categorie in (
    'vendeur', 'acquereur', 'bien', 'financement',
    'admin', 'succession', 'promoteur'
  ));
