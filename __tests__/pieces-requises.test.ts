import { describe, it, expect } from 'vitest';
import { getPiecesRequises } from '../lib/pieces-requises/index';
import type { TypeActe, PieceRequise } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_TYPES: TypeActe[] = [
  'compromis_vente', 'promesse_vente', 'vente_simple',
  'vefa', 'vente_viager',
  'donation_immobiliere', 'donation_partage',
  'succession_immo', 'pret_hypothecaire',
  'mainlevee', 'bail_emphyteotique',
  'servitude', 'etat_descriptif', 'reglement_copropriete',
];

function hasPiece(pieces: PieceRequise[], nom: string): boolean {
  return pieces.some((p) => p.nom === nom);
}

function hasDuplicates(pieces: PieceRequise[]): boolean {
  const noms = pieces.map((p) => p.nom);
  return noms.length !== new Set(noms).size;
}

// ---------------------------------------------------------------------------
// Suite générique — tous les types d'acte
// ---------------------------------------------------------------------------

describe('getPiecesRequises — générique', () => {
  it("retourne un tableau non vide pour chaque type d'acte", () => {
    for (const type of ALL_TYPES) {
      expect(getPiecesRequises(type).length).toBeGreaterThan(0);
    }
  });

  it("ne contient aucun doublon (nom) pour chaque type d'acte", () => {
    for (const type of ALL_TYPES) {
      const pieces = getPiecesRequises(type);
      expect(hasDuplicates(pieces), `doublon détecté pour ${type}`).toBe(false);
    }
  });

  it('chaque pièce a un nom, une catégorie et un flag obligatoire', () => {
    for (const type of ALL_TYPES) {
      for (const piece of getPiecesRequises(type)) {
        expect(typeof piece.nom).toBe('string');
        expect(piece.nom.length).toBeGreaterThan(0);
        expect(typeof piece.categorie).toBe('string');
        expect(typeof piece.obligatoire).toBe('boolean');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Pièces communes — types avec parties vendeur + acquéreur
// ---------------------------------------------------------------------------

const TYPES_AVEC_PARTIES: TypeActe[] = [
  'compromis_vente', 'promesse_vente', 'vente_simple', 'vefa',
  'vente_viager', 'bail_emphyteotique', 'servitude',
];

describe('getPiecesRequises — pièces communes (vendeur + acquéreur)', () => {
  for (const type of TYPES_AVEC_PARTIES) {
    it(`${type} contient la pièce d'identité vendeur`, () => {
      const pieces = getPiecesRequises(type);
      expect(hasPiece(pieces, "Carte d'identité ou passeport (vendeur)")).toBe(true);
    });

    it(`${type} contient la pièce d'identité acquéreur`, () => {
      const pieces = getPiecesRequises(type);
      expect(hasPiece(pieces, "Carte d'identité ou passeport (acquéreur)")).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Ventes classiques (compromis / promesse / vente simple)
// ---------------------------------------------------------------------------

describe('getPiecesRequises — ventes classiques', () => {
  const TYPES_VENTE: TypeActe[] = ['compromis_vente', 'promesse_vente', 'vente_simple'];

  for (const type of TYPES_VENTE) {
    it(`${type} contient le DPE (validité 120 mois)`, () => {
      const pieces = getPiecesRequises(type);
      const dpe = pieces.find((p) => p.nom === 'DPE (Diagnostic de Performance Énergétique)');
      expect(dpe).toBeDefined();
      expect(dpe?.validite_mois).toBe(120);
    });

    it(`${type} contient l'ERP (validité 6 mois)`, () => {
      const pieces = getPiecesRequises(type);
      const erp = pieces.find((p) => p.nom === 'ERP (État des Risques et Pollutions)');
      expect(erp).toBeDefined();
      expect(erp?.validite_mois).toBe(6);
    });

    it(`${type} contient le titre de propriété`, () => {
      expect(hasPiece(getPiecesRequises(type), 'Titre de propriété')).toBe(true);
    });

    it(`${type} contient l'accord de financement acquéreur`, () => {
      expect(
        hasPiece(getPiecesRequises(type), 'Attestation de financement ou accord de principe bancaire'),
      ).toBe(true);
    });

    it(`${type} contient le certificat d'urbanisme`, () => {
      expect(
        hasPiece(getPiecesRequises(type), "Certificat d'urbanisme (CU opérationnel ou informatif)"),
      ).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// VEFA
// ---------------------------------------------------------------------------

describe('getPiecesRequises — vefa', () => {
  const pieces = getPiecesRequises('vefa');

  it('contient le permis de construire', () => {
    expect(hasPiece(pieces, 'Permis de construire et pièces annexées')).toBe(true);
  });

  it("contient la GFA", () => {
    expect(hasPiece(pieces, "Garantie Financière d'Achèvement (GFA)")).toBe(true);
  });

  it('contient la dommages-ouvrage', () => {
    expect(hasPiece(pieces, "Attestation d'assurance dommages-ouvrage (DO)")).toBe(true);
  });

  it('contient la conformité RT2012 / RE2020', () => {
    expect(hasPiece(pieces, 'Attestation conformité RT2012 / RE2020')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Prêt hypothécaire
// ---------------------------------------------------------------------------

describe('getPiecesRequises — pret_hypothecaire', () => {
  const pieces = getPiecesRequises('pret_hypothecaire');

  it("contient l'offre de prêt", () => {
    expect(hasPiece(pieces, 'Offre de prêt (délai légal 10 jours avant signature)')).toBe(true);
  });

  it('contient la FISE', () => {
    expect(hasPiece(pieces, "Fiche d'Information Standardisée Européenne (FISE)")).toBe(true);
  });

  it("contient l'attestation assurance emprunteur", () => {
    expect(hasPiece(pieces, 'Attestation assurance emprunteur')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Donation
// ---------------------------------------------------------------------------

describe('getPiecesRequises — donations', () => {
  for (const type of ['donation_immobiliere', 'donation_partage'] as TypeActe[]) {
    it(`${type} contient l'identité vendeur (donateur)`, () => {
      expect(hasPiece(getPiecesRequises(type), "Carte d'identité ou passeport (vendeur)")).toBe(true);
    });

    it(`${type} contient l'expertise valeur du bien`, () => {
      expect(hasPiece(getPiecesRequises(type), 'Attestation valeur du bien (expertise)')).toBe(true);
    });

    it(`${type} contient le justificatif du lien de parenté`, () => {
      expect(hasPiece(getPiecesRequises(type), 'Justificatif du lien de parenté')).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Succession
// ---------------------------------------------------------------------------

describe('getPiecesRequises — succession_immo', () => {
  const pieces = getPiecesRequises('succession_immo');

  it("contient l'acte de décès", () => {
    expect(hasPiece(pieces, 'Acte de décès du défunt')).toBe(true);
  });

  it('contient le formulaire 2705', () => {
    expect(hasPiece(pieces, 'Déclaration de succession — formulaire 2705')).toBe(true);
  });

  it("contient l'état de l'actif successoral", () => {
    expect(hasPiece(pieces, "État de l'actif successoral complet")).toBe(true);
  });

  it("contient le certificat d'hérédité", () => {
    expect(hasPiece(pieces, "Certificat d'hérédité ou attestation notariée")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Viager
// ---------------------------------------------------------------------------

describe('getPiecesRequises — vente_viager', () => {
  const pieces = getPiecesRequises('vente_viager');

  it("contient le rapport d'expertise pour la rente", () => {
    expect(hasPiece(pieces, "Rapport d'expertise pour calcul de la rente")).toBe(true);
  });

  it('contient le certificat médical (validité 3 mois)', () => {
    const cert = pieces.find((p) => p.nom === 'Certificat médical du crédirentier (< 3 mois)');
    expect(cert).toBeDefined();
    expect(cert?.validite_mois).toBe(3);
  });

  it("contient l'attestation assurance décès", () => {
    expect(hasPiece(pieces, "Attestation d'assurance décès")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mainlevée
// ---------------------------------------------------------------------------

describe('getPiecesRequises — mainlevee', () => {
  const pieces = getPiecesRequises('mainlevee');

  it("contient l'acte de prêt d'origine", () => {
    expect(hasPiece(pieces, "Acte de prêt d'origine")).toBe(true);
  });

  it("contient l'accord de mainlevée", () => {
    expect(hasPiece(pieces, 'Accord de mainlevée de la banque')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bail emphytéotique
// ---------------------------------------------------------------------------

describe('getPiecesRequises — bail_emphyteotique', () => {
  const pieces = getPiecesRequises('bail_emphyteotique');

  it("contient l'attestation d'affectation", () => {
    expect(hasPiece(pieces, "Attestation d'affectation du bien")).toBe(true);
  });

  it('le bail en vigueur est optionnel (renouvellement)', () => {
    const bail = pieces.find((p) => p.nom === 'Bail emphytéotique en vigueur (si renouvellement)');
    expect(bail).toBeDefined();
    expect(bail?.obligatoire).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Validités des diagnostics
// ---------------------------------------------------------------------------

describe('getPiecesRequises — validités diagnostics', () => {
  it('électricité : 36 mois', () => {
    const pieces = getPiecesRequises('vente_simple');
    const elec = pieces.find((p) => p.nom === 'Diagnostic électricité');
    expect(elec?.validite_mois).toBe(36);
  });

  it('gaz : 36 mois', () => {
    const pieces = getPiecesRequises('vente_simple');
    const gaz = pieces.find((p) => p.nom === 'Diagnostic gaz');
    expect(gaz?.validite_mois).toBe(36);
  });

  it('DPE : 120 mois', () => {
    const pieces = getPiecesRequises('vente_viager');
    const dpe = pieces.find((p) => p.nom === 'DPE (Diagnostic de Performance Énergétique)');
    expect(dpe?.validite_mois).toBe(120);
  });

  it('Mesurage Carrez : pas de validité (illimité)', () => {
    const pieces = getPiecesRequises('vente_simple');
    const carrez = pieces.find((p) => p.nom === 'Mesurage Loi Carrez');
    expect(carrez?.validite_mois).toBeUndefined();
  });
});
