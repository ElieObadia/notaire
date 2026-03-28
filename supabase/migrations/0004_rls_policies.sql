-- Migration 0004 : Row Level Security sur toutes les tables

-- Activer RLS
alter table dossiers      enable row level security;
alter table pieces_dossier enable row level security;
alter table rappels       enable row level security;

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
