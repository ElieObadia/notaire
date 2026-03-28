// types/index.ts

export type TypeActe =
  | 'compromis_vente'
  | 'promesse_vente'
  | 'vente_simple'
  | 'vefa'
  | 'vente_viager'
  | 'donation_immobiliere'
  | 'donation_partage'
  | 'succession_immo'
  | 'pret_hypothecaire'
  | 'mainlevee'
  | 'bail_emphyteotique'
  | 'servitude'
  | 'etat_descriptif'
  | 'reglement_copropriete';

export type StatutDossier = 'en_cours' | 'signe' | 'archive';

export type CategoriePiece =
  | 'vendeur'
  | 'acquereur'
  | 'bien'
  | 'financement'
  | 'admin'
  | 'succession'
  | 'promoteur';

export type TypeRappel =
  | 'purge_dpu_envoi_dia'
  | 'purge_dpu_fin_delai'
  | 'purge_safer'
  | 'purge_droit_locataire'
  | 'retractation_sru_fin'
  | 'reflexion_sru_fin'
  | 'condition_suspensive_pret'
  | 'acceptation_offre_pret'
  | 'reflexion_vefa'
  | 'declaration_succession'
  | 'signature_imminente'
  | 'rappel_signature'
  | 'relance_pieces_manquantes';

export type StatutRappel =
  | 'a_faire'
  | 'en_cours'
  | 'alerte'
  | 'critique'
  | 'realise'
  | 'depasse';

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

export interface PieceRequise {
  nom: string;
  categorie: CategoriePiece;
  obligatoire: boolean;
  validite_mois?: number;
}
