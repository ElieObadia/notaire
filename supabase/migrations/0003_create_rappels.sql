-- Migration 0003 : Création de la table rappels

create table rappels (
  id                   uuid primary key default gen_random_uuid(),
  dossier_id           uuid references dossiers(id) on delete cascade not null,
  type_rappel          text not null,
  date_rappel          date not null,
  statut               text not null default 'a_faire',
  envoye               boolean not null default false,
  date_envoi           timestamptz,
  message_personnalise text,
  created_at           timestamptz not null default now()
);

create index rappels_dossier_id_idx  on rappels(dossier_id);
create index rappels_date_rappel_idx on rappels(date_rappel);

-- Contrainte type_rappel
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

-- Contrainte statut
alter table rappels add constraint rappels_statut_check
  check (statut in (
    'a_faire', 'en_cours', 'alerte', 'critique', 'realise', 'depasse'
  ));
