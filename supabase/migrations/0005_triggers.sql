-- Migration 0005 : Trigger updated_at sur la table dossiers

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
