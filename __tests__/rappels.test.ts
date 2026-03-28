import { describe, it, expect } from 'vitest'
import { getRappels } from '../lib/rappels/index'
import type { Dossier } from '../types'

function makeDossier(overrides: Partial<Dossier> = {}): Dossier {
  return {
    id: 'test-id',
    reference: 'TEST-001',
    type_acte: 'compromis_vente',
    date_signature: '2026-06-15',
    statut: 'en_cours',
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// compromis_vente avec date_compromis
// ---------------------------------------------------------------------------

describe('getRappels — compromis_vente avec date_compromis', () => {
  // date_compromis = 2026-04-01 (Mercredi)
  // +11 = 2026-04-12 (Dimanche) → prochainJourOuvre → Lundi 2026-04-13
  const dossier = makeDossier({
    type_acte: 'compromis_vente',
    date_compromis: '2026-04-01',
    date_signature: '2026-06-15',
  })
  const rappels = getRappels(dossier)

  it('retourne 8 rappels (3 compromis + 5 signature)', () => {
    expect(rappels).toHaveLength(8)
  })

  it("tous les rappels ont le statut 'a_faire'", () => {
    for (const r of rappels) {
      expect(r.statut).toBe('a_faire')
    }
  })

  it("retractation_sru_fin : J+11 (dimanche reporté au lundi)", () => {
    const r = rappels.find((r) => r.type_rappel === 'retractation_sru_fin')
    expect(r).toBeDefined()
    expect(r!.date_rappel).toBe('2026-04-13') // Dimanche 12 → Lundi 13
  })

  it('purge_dpu_envoi_dia : lendemain du compromis', () => {
    const r = rappels.find((r) => r.type_rappel === 'purge_dpu_envoi_dia')
    expect(r).toBeDefined()
    expect(r!.date_rappel).toBe('2026-04-02')
  })

  it('purge_dpu_fin_delai : J+65 après compromis', () => {
    const r = rappels.find((r) => r.type_rappel === 'purge_dpu_fin_delai')
    expect(r).toBeDefined()
    expect(r!.date_rappel).toBe('2026-06-05') // 2026-04-01 + 65j
  })

  it('signature_imminente : J-7 avant signature', () => {
    const r = rappels.find((r) => r.type_rappel === 'signature_imminente')
    expect(r).toBeDefined()
    expect(r!.date_rappel).toBe('2026-06-08') // 15 juin - 7
  })

  it('rappel_signature : J-1 avant signature', () => {
    const r = rappels.find((r) => r.type_rappel === 'rappel_signature')
    expect(r).toBeDefined()
    expect(r!.date_rappel).toBe('2026-06-14')
  })

  it('3 relances pièces manquantes à J-30, J-14, J-7', () => {
    const relances = rappels.filter((r) => r.type_rappel === 'relance_pieces_manquantes')
    expect(relances).toHaveLength(3)
    const dates = relances.map((r) => r.date_rappel).sort()
    expect(dates).toContain('2026-05-16') // 15 juin - 30
    expect(dates).toContain('2026-06-01') // 15 juin - 14
    expect(dates).toContain('2026-06-08') // 15 juin - 7
  })
})

// ---------------------------------------------------------------------------
// Rétractation SRU — report au prochain jour ouvré si week-end
// ---------------------------------------------------------------------------

describe('getRappels — rétractation SRU : report si week-end', () => {
  it('J+11 tombe samedi → reporté au lundi', () => {
    // 2026-03-24 (Mardi) + 11 = 2026-04-04 (Samedi) → Lundi 2026-04-06
    const dossier = makeDossier({
      date_compromis: '2026-03-24',
      date_signature: '2026-06-01',
    })
    const rappels = getRappels(dossier)
    const sru = rappels.find((r) => r.type_rappel === 'retractation_sru_fin')
    expect(sru!.date_rappel).toBe('2026-04-06')
  })

  it('J+11 tombe dimanche → reporté au lundi', () => {
    // 2026-03-25 (Mercredi) + 11 = 2026-04-05 (Dimanche) → Lundi 2026-04-06
    const dossier = makeDossier({
      date_compromis: '2026-03-25',
      date_signature: '2026-06-01',
    })
    const rappels = getRappels(dossier)
    const sru = rappels.find((r) => r.type_rappel === 'retractation_sru_fin')
    expect(sru!.date_rappel).toBe('2026-04-06')
  })

  it('J+11 tombe un lundi → pas de report', () => {
    // 2026-03-23 (Lundi) + 11 = 2026-04-03 (Vendredi)
    const dossier = makeDossier({
      date_compromis: '2026-03-23',
      date_signature: '2026-06-01',
    })
    const rappels = getRappels(dossier)
    const sru = rappels.find((r) => r.type_rappel === 'retractation_sru_fin')
    expect(sru!.date_rappel).toBe('2026-04-03')
  })
})

// ---------------------------------------------------------------------------
// vefa — sans date_compromis
// ---------------------------------------------------------------------------

describe('getRappels — vefa (sans date_compromis)', () => {
  const dossier = makeDossier({ type_acte: 'vefa', date_signature: '2026-09-01' })
  const rappels = getRappels(dossier)

  it('retourne 5 rappels (signature uniquement, pas de rappels compromis)', () => {
    expect(rappels).toHaveLength(5)
  })

  it("n'inclut pas retractation_sru_fin", () => {
    expect(rappels.find((r) => r.type_rappel === 'retractation_sru_fin')).toBeUndefined()
  })

  it("n'inclut pas purge_dpu_envoi_dia", () => {
    expect(rappels.find((r) => r.type_rappel === 'purge_dpu_envoi_dia')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// succession_immo
// ---------------------------------------------------------------------------

describe('getRappels — succession_immo', () => {
  const dossier = makeDossier({ type_acte: 'succession_immo', date_signature: '2026-07-01' })
  const rappels = getRappels(dossier)

  it('retourne 5 rappels (sans date_compromis)', () => {
    expect(rappels).toHaveLength(5)
  })

  it('declaration_succession non calculée automatiquement (requiert date_deces)', () => {
    // Ce rappel doit être créé manuellement : date_deces n'est pas un champ de Dossier.
    // Délai légal : 6 mois en France, 12 mois hors France (art. 641-6 CGI).
    expect(rappels.find((r) => r.type_rappel === 'declaration_succession')).toBeUndefined()
  })
})
