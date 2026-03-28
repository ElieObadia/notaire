import type { StatutRappel } from '../../types'

/**
 * Ajoute N jours ouvrés (hors week-end, sans jours fériés) à une date.
 * Toutes les opérations en UTC pour éviter les décalages de fuseau.
 */
export function addJoursOuvres(date: Date, jours: number): Date {
  const result = new Date(date)
  const step = jours >= 0 ? 1 : -1
  let remaining = Math.abs(jours)
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + step)
    const day = result.getUTCDay()
    if (day !== 0 && day !== 6) remaining--
  }
  return result
}

/**
 * Avance une date ISO au prochain jour ouvré si elle tombe un week-end.
 */
export function prochainJourOuvre(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00Z')
  const day = date.getUTCDay()
  if (day === 6) date.setUTCDate(date.getUTCDate() + 2) // samedi → lundi
  else if (day === 0) date.setUTCDate(date.getUTCDate() + 1) // dimanche → lundi
  return date.toISOString().split('T')[0]
}

/**
 * Calcule le statut d'un rappel selon l'écart avec la date courante (UTC).
 */
export function getStatutRappel(dateRappel: string): StatutRappel {
  const now = new Date()
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const [year, month, day] = dateRappel.split('-').map(Number)
  const rappelMs = Date.UTC(year, month - 1, day)
  const diffJours = Math.round((rappelMs - todayMs) / 86_400_000)

  if (diffJours < 0) return 'depasse'
  if (diffJours <= 2) return 'critique'
  if (diffJours <= 7) return 'alerte'
  if (diffJours <= 30) return 'en_cours'
  return 'a_faire'
}

/**
 * Formate une date ISO (YYYY-MM-DD) en DD/MM/YYYY pour l'affichage.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Parse une date DD/MM/YYYY vers ISO YYYY-MM-DD.
 */
export function parseDate(displayDate: string): string {
  const [day, month, year] = displayDate.split('/')
  return `${year}-${month}-${day}`
}
