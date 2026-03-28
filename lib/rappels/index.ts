import type { Dossier, Rappel, TypeRappel } from '../../types'
import { prochainJourOuvre } from '../dates'

type RappelCalcule = Omit<Rappel, 'id' | 'envoye' | 'date_envoi' | 'created_at'>

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

function makeRappel(dossier_id: string, type_rappel: TypeRappel, date_rappel: string): RappelCalcule {
  return { dossier_id, type_rappel, date_rappel, statut: 'a_faire' }
}

export function getRappels(dossier: Dossier): RappelCalcule[] {
  const { id, date_signature, date_compromis } = dossier
  const result: RappelCalcule[] = []

  // --- Rappels basés sur date_compromis ---
  if (date_compromis) {
    // Fin délai rétractation SRU : J+11 calendaires, reporté au lundi si week-end
    result.push(makeRappel(id, 'retractation_sru_fin', prochainJourOuvre(addDays(date_compromis, 11))))
    // Envoi DIA pour purge DPU : lendemain du compromis
    result.push(makeRappel(id, 'purge_dpu_envoi_dia', addDays(date_compromis, 1)))
    // Fin délai DPU : J+65
    result.push(makeRappel(id, 'purge_dpu_fin_delai', addDays(date_compromis, 65)))
  }

  // --- Rappels basés sur date_signature ---
  result.push(makeRappel(id, 'signature_imminente', addDays(date_signature, -7)))
  result.push(makeRappel(id, 'rappel_signature', addDays(date_signature, -1)))

  // Relances pièces manquantes : J-30, J-14, J-7
  result.push(makeRappel(id, 'relance_pieces_manquantes', addDays(date_signature, -30)))
  result.push(makeRappel(id, 'relance_pieces_manquantes', addDays(date_signature, -14)))
  result.push(makeRappel(id, 'relance_pieces_manquantes', addDays(date_signature, -7)))

  return result
}
