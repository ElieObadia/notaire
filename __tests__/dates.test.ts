import { describe, it, expect } from 'vitest'
import { addJoursOuvres, getStatutRappel, formatDate, parseDate } from '../lib/dates/index'

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/** Date ISO UTC = aujourd'hui + N jours (UTC). */
function isoFromToday(daysOffset: number): string {
  const now = new Date()
  const ms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysOffset)
  return new Date(ms).toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// addJoursOuvres
// ---------------------------------------------------------------------------

describe('addJoursOuvres', () => {
  it('lundi + 3 jours ouvrés → jeudi (pas de week-end)', () => {
    // Lundi 6 oct 2025 + 3 BD = Jeudi 9 oct 2025
    const lundi = new Date('2025-10-06T00:00:00Z')
    expect(isoDate(addJoursOuvres(lundi, 3))).toBe('2025-10-09')
  })

  it('lundi + 5 jours ouvrés → lundi suivant (passe le week-end)', () => {
    // Lundi 23 mars 2026 + 5 BD : Mar 24, Mer 25, Jeu 26, Ven 27, [Sam 28 skip, Dim 29 skip], Lun 30
    const lundi = new Date('2026-03-23T00:00:00Z')
    expect(isoDate(addJoursOuvres(lundi, 5))).toBe('2026-03-30')
  })

  it('vendredi + 1 jour ouvré → lundi (passe le week-end)', () => {
    const vendredi = new Date('2026-03-27T00:00:00Z')
    expect(isoDate(addJoursOuvres(vendredi, 1))).toBe('2026-03-30')
  })

  it('vendredi + 3 jours ouvrés → mercredi (passe le week-end)', () => {
    const vendredi = new Date('2026-03-27T00:00:00Z')
    expect(isoDate(addJoursOuvres(vendredi, 3))).toBe('2026-04-01')
  })

  it('passage fin de mois : vendredi 28 nov 2025 + 3 jours ouvrés → mercredi 3 déc', () => {
    const vendredi = new Date('2025-11-28T00:00:00Z')
    expect(isoDate(addJoursOuvres(vendredi, 3))).toBe('2025-12-03')
  })

  it('0 jour ouvré → même date', () => {
    const date = new Date('2026-03-25T00:00:00Z')
    expect(isoDate(addJoursOuvres(date, 0))).toBe('2026-03-25')
  })
})

// ---------------------------------------------------------------------------
// getStatutRappel
// ---------------------------------------------------------------------------

describe('getStatutRappel', () => {
  it("date passée → 'depasse'", () => {
    expect(getStatutRappel(isoFromToday(-1))).toBe('depasse')
  })

  it("aujourd'hui → 'critique'", () => {
    expect(getStatutRappel(isoFromToday(0))).toBe('critique')
  })

  it("dans 2 jours → 'critique'", () => {
    expect(getStatutRappel(isoFromToday(2))).toBe('critique')
  })

  it("dans 3 jours → 'alerte'", () => {
    expect(getStatutRappel(isoFromToday(3))).toBe('alerte')
  })

  it("dans 7 jours → 'alerte'", () => {
    expect(getStatutRappel(isoFromToday(7))).toBe('alerte')
  })

  it("dans 8 jours → 'en_cours'", () => {
    expect(getStatutRappel(isoFromToday(8))).toBe('en_cours')
  })

  it("dans 30 jours → 'en_cours'", () => {
    expect(getStatutRappel(isoFromToday(30))).toBe('en_cours')
  })

  it("dans 31 jours → 'a_faire'", () => {
    expect(getStatutRappel(isoFromToday(31))).toBe('a_faire')
  })
})

// ---------------------------------------------------------------------------
// formatDate / parseDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formate une date ISO en DD/MM/YYYY', () => {
    expect(formatDate('2026-03-28')).toBe('28/03/2026')
  })

  it('conserve le zéro pour les mois et jours < 10', () => {
    expect(formatDate('2026-01-05')).toBe('05/01/2026')
  })
})

describe('parseDate', () => {
  it('parse une date DD/MM/YYYY en ISO YYYY-MM-DD', () => {
    expect(parseDate('28/03/2026')).toBe('2026-03-28')
  })

  it('formatDate et parseDate sont inverses', () => {
    const iso = '2026-07-14'
    expect(parseDate(formatDate(iso))).toBe(iso)
  })
})
