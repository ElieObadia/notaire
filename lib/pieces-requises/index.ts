import type { TypeActe, CategoriePiece, PieceRequise } from '../../types';

// ---------------------------------------------------------------------------
// Blocs réutilisables
// ---------------------------------------------------------------------------

const IDENTITE_VENDEUR: PieceRequise[] = [
  { nom: "Carte d'identité ou passeport (vendeur)", categorie: 'vendeur', obligatoire: true },
  { nom: 'Justificatif de domicile < 3 mois (vendeur)', categorie: 'vendeur', obligatoire: true },
];

const IDENTITE_ACQUEREUR: PieceRequise[] = [
  { nom: "Carte d'identité ou passeport (acquéreur)", categorie: 'acquereur', obligatoire: true },
  { nom: 'Justificatif de domicile < 3 mois (acquéreur)', categorie: 'acquereur', obligatoire: true },
  {
    nom: 'Justificatif de situation familiale (livret de famille, PACS…)',
    categorie: 'acquereur',
    obligatoire: false,
  },
];

/** Pièces communes aux transactions bilatérales (vente, donation…) */
const PIECES_COMMUNES: PieceRequise[] = [...IDENTITE_VENDEUR, ...IDENTITE_ACQUEREUR];

// ---------------------------------------------------------------------------
// Bien immobilier
// ---------------------------------------------------------------------------

const BIEN_TITRE: PieceRequise[] = [
  { nom: 'Titre de propriété', categorie: 'bien', obligatoire: true },
  { nom: 'État hypothécaire (relevé de situation hypothécaire)', categorie: 'bien', obligatoire: true },
  { nom: 'Taxe foncière dernière année', categorie: 'bien', obligatoire: true },
];

/** Diagnostics DDT avec validités légales */
const DIAGNOSTICS_DDT: PieceRequise[] = [
  { nom: 'DPE (Diagnostic de Performance Énergétique)', categorie: 'bien', obligatoire: true, validite_mois: 120 },
  { nom: 'CREP (Constat Risque Exposition Plomb)', categorie: 'bien', obligatoire: true },
  { nom: 'Diagnostic amiante', categorie: 'bien', obligatoire: true },
  { nom: 'ERP (État des Risques et Pollutions)', categorie: 'bien', obligatoire: true, validite_mois: 6 },
  { nom: 'Diagnostic électricité', categorie: 'bien', obligatoire: true, validite_mois: 36 },
  { nom: 'Diagnostic gaz', categorie: 'bien', obligatoire: true, validite_mois: 36 },
  { nom: 'Mesurage Loi Carrez', categorie: 'bien', obligatoire: false },
];

/** Documents copropriété (loi ALUR) */
const DOCS_COPROPRIETE: PieceRequise[] = [
  { nom: "Procès-verbaux d'AG (3 derniers)", categorie: 'bien', obligatoire: true },
  { nom: 'Règlement de copropriété + modificatifs', categorie: 'bien', obligatoire: true },
  { nom: 'Fiche synthétique de copropriété', categorie: 'bien', obligatoire: true },
  { nom: 'Dernier appel de charges', categorie: 'bien', obligatoire: true },
];

// ---------------------------------------------------------------------------
// Financement / admin
// ---------------------------------------------------------------------------

const FINANCEMENT_ACQUEREUR: PieceRequise[] = [
  {
    nom: "Attestation de financement ou accord de principe bancaire",
    categorie: 'financement',
    obligatoire: true,
  },
];

const PIECES_URBANISME: PieceRequise[] = [
  { nom: "Offre d'achat acceptée", categorie: 'admin', obligatoire: true },
  { nom: "Certificat d'urbanisme (CU opérationnel ou informatif)", categorie: 'admin', obligatoire: true },
];

// ---------------------------------------------------------------------------
// Configuration statique par type d'acte
// ---------------------------------------------------------------------------

const CONFIG: Record<TypeActe, PieceRequise[]> = {
  // --- Ventes classiques ---
  compromis_vente: [
    ...PIECES_COMMUNES,
    ...BIEN_TITRE,
    ...DIAGNOSTICS_DDT,
    ...DOCS_COPROPRIETE,
    ...PIECES_URBANISME,
    ...FINANCEMENT_ACQUEREUR,
  ],

  promesse_vente: [
    ...PIECES_COMMUNES,
    ...BIEN_TITRE,
    ...DIAGNOSTICS_DDT,
    ...DOCS_COPROPRIETE,
    ...PIECES_URBANISME,
    ...FINANCEMENT_ACQUEREUR,
  ],

  vente_simple: [
    ...PIECES_COMMUNES,
    ...BIEN_TITRE,
    ...DIAGNOSTICS_DDT,
    ...DOCS_COPROPRIETE,
    ...PIECES_URBANISME,
    ...FINANCEMENT_ACQUEREUR,
  ],

  // --- VEFA ---
  vefa: [
    ...PIECES_COMMUNES,
    { nom: 'Permis de construire et pièces annexées', categorie: 'promoteur', obligatoire: true },
    { nom: "Garantie Financière d'Achèvement (GFA)", categorie: 'promoteur', obligatoire: true },
    { nom: "Attestation d'assurance dommages-ouvrage (DO)", categorie: 'promoteur', obligatoire: true },
    { nom: 'Plans du bien', categorie: 'promoteur', obligatoire: true },
    { nom: 'Notice descriptive', categorie: 'promoteur', obligatoire: true },
    { nom: 'État descriptif de division', categorie: 'promoteur', obligatoire: true },
    { nom: 'Attestation conformité RT2012 / RE2020', categorie: 'promoteur', obligatoire: true },
    ...FINANCEMENT_ACQUEREUR,
  ],

  // --- Viager ---
  vente_viager: [
    ...PIECES_COMMUNES,
    ...BIEN_TITRE,
    ...DIAGNOSTICS_DDT,
    { nom: "Rapport d'expertise pour calcul de la rente", categorie: 'bien', obligatoire: true },
    { nom: 'Tableau de calcul rente viagère', categorie: 'bien', obligatoire: true },
    {
      nom: 'Certificat médical du crédirentier (< 3 mois)',
      categorie: 'vendeur',
      obligatoire: true,
      validite_mois: 3,
    },
    { nom: "Attestation d'assurance décès", categorie: 'vendeur', obligatoire: true },
  ],

  // --- Donation ---
  donation_immobiliere: [
    ...IDENTITE_VENDEUR,
    { nom: "Carte d'identité ou passeport (donataire)", categorie: 'acquereur', obligatoire: true },
    { nom: 'Acte de naissance du donataire', categorie: 'acquereur', obligatoire: true },
    { nom: 'Justificatif du lien de parenté', categorie: 'acquereur', obligatoire: true },
    ...BIEN_TITRE,
    { nom: 'Attestation valeur du bien (expertise)', categorie: 'bien', obligatoire: true },
    { nom: 'Déclaration de don manuel (si applicable)', categorie: 'admin', obligatoire: false },
  ],

  donation_partage: [
    ...IDENTITE_VENDEUR,
    { nom: "Carte d'identité ou passeport (donataire)", categorie: 'acquereur', obligatoire: true },
    { nom: 'Acte de naissance de chaque donataire', categorie: 'acquereur', obligatoire: true },
    { nom: 'Justificatif du lien de parenté', categorie: 'acquereur', obligatoire: true },
    ...BIEN_TITRE,
    { nom: 'Attestation valeur du bien (expertise)', categorie: 'bien', obligatoire: true },
  ],

  // --- Succession ---
  succession_immo: [
    { nom: 'Acte de décès du défunt', categorie: 'succession', obligatoire: true },
    { nom: 'Acte de naissance du défunt', categorie: 'succession', obligatoire: true },
    { nom: 'Livret de famille du défunt', categorie: 'succession', obligatoire: true },
    { nom: "Actes d'état civil des héritiers", categorie: 'succession', obligatoire: true },
    { nom: 'Testament (si existant)', categorie: 'succession', obligatoire: false },
    { nom: 'Relevés bancaires du défunt', categorie: 'succession', obligatoire: true },
    { nom: "Certificat d'hérédité ou attestation notariée", categorie: 'succession', obligatoire: true },
    { nom: 'Déclaration de succession — formulaire 2705', categorie: 'admin', obligatoire: true },
    { nom: "Titres de propriété du défunt", categorie: 'bien', obligatoire: true },
    { nom: "État de l'actif successoral complet", categorie: 'succession', obligatoire: true },
  ],

  // --- Prêt hypothécaire ---
  pret_hypothecaire: [
    ...IDENTITE_ACQUEREUR,
    ...BIEN_TITRE,
    {
      nom: 'Offre de prêt (délai légal 10 jours avant signature)',
      categorie: 'financement',
      obligatoire: true,
    },
    { nom: "Tableau d'amortissement", categorie: 'financement', obligatoire: true },
    { nom: "Fiche d'Information Standardisée Européenne (FISE)", categorie: 'financement', obligatoire: true },
    { nom: "Attestation assurance emprunteur", categorie: 'financement', obligatoire: true },
    { nom: "Délégation d'assurance (banque)", categorie: 'financement', obligatoire: false },
  ],

  // --- Mainlevée ---
  mainlevee: [
    ...IDENTITE_ACQUEREUR,
    ...BIEN_TITRE,
    { nom: "Acte de prêt d'origine", categorie: 'financement', obligatoire: true },
    { nom: 'Attestation de remboursement total du prêt', categorie: 'financement', obligatoire: true },
    { nom: 'Accord de mainlevée de la banque', categorie: 'financement', obligatoire: true },
  ],

  // --- Bail emphytéotique ---
  bail_emphyteotique: [
    ...PIECES_COMMUNES,
    ...BIEN_TITRE,
    { nom: "Bail emphytéotique en vigueur (si renouvellement)", categorie: 'bien', obligatoire: false },
    { nom: "Attestation d'affectation du bien", categorie: 'bien', obligatoire: true },
    { nom: "Attestation d'assurance", categorie: 'bien', obligatoire: true },
  ],

  // --- Servitude ---
  servitude: [
    ...PIECES_COMMUNES,
    ...BIEN_TITRE,
    { nom: 'Titre constitutif de servitude (si existant)', categorie: 'bien', obligatoire: false },
    { nom: 'Plan de délimitation de la servitude', categorie: 'bien', obligatoire: true },
  ],

  // --- État descriptif de division ---
  etat_descriptif: [
    ...IDENTITE_VENDEUR,
    ...BIEN_TITRE,
    { nom: 'Plans du bien (par lot)', categorie: 'bien', obligatoire: true },
    { nom: 'Règlement de copropriété (si applicable)', categorie: 'bien', obligatoire: false },
  ],

  // --- Règlement de copropriété ---
  reglement_copropriete: [
    ...IDENTITE_VENDEUR,
    ...BIEN_TITRE,
    ...DOCS_COPROPRIETE,
    { nom: "Plan de l'immeuble", categorie: 'bien', obligatoire: true },
    { nom: 'État descriptif de division', categorie: 'bien', obligatoire: true },
  ],
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function getPiecesRequises(typeActe: TypeActe): PieceRequise[] {
  return CONFIG[typeActe] ?? [];
}
