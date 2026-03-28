import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getStatutRappel } from '@/lib/dates'
import DossierCard from '@/components/dossier/DossierCard'
import StatsBanner from '@/components/dashboard/StatsBanner'
import AlertesWidget from '@/components/dashboard/AlertesWidget'
import CalendrierSignatures from '@/components/dashboard/CalendrierSignatures'
import FiltresDossiers from '@/components/dashboard/FiltresDossiers'
import type { StatutRappel, TypeRappel } from '@/types'
import type { AlerteItem } from '@/components/dashboard/AlertesWidget'
import type { SignatureItem } from '@/components/dashboard/CalendrierSignatures'

interface SearchParams {
  q?: string
  statut?: string
  type_acte?: string
  mois?: string
  tri?: string
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { q, statut, type_acte, mois, tri = 'date_signature' } = searchParams

  // Date helpers
  const now = new Date()
  const todayStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString().split('T')[0]
  const in7DaysStr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7))
    .toISOString().split('T')[0]
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    .toISOString().split('T')[0]

  // Build dossiers query
  let query = supabase
    .from('dossiers')
    .select('*')
    .eq('user_id', user.id)

  if (q) {
    query = query.or(
      `reference.ilike.%${q}%,vendeur_nom.ilike.%${q}%,acquereur_nom.ilike.%${q}%,adresse_bien.ilike.%${q}%`,
    )
  }
  if (statut) {
    query = query.eq('statut', statut)
  }
  if (type_acte) {
    query = query.eq('type_acte', type_acte)
  }
  if (mois) {
    const [yr, mo] = mois.split('-')
    const nextMo = String(Number(mo) + 1).padStart(2, '0')
    const nextYr = Number(mo) === 12 ? String(Number(yr) + 1) : yr
    const moStart = `${yr}-${mo}-01`
    const moEnd = Number(mo) === 12 ? `${nextYr}-01-01` : `${yr}-${nextMo}-01`
    query = query.gte('date_signature', moStart).lt('date_signature', moEnd)
  }

  // Sort: pieces_manquantes is computed after fetch
  if (tri === 'reference') {
    query = query.order('reference', { ascending: true })
  } else {
    query = query.order('date_signature', { ascending: true })
  }

  const { data: dossiers } = await query

  const ids = (dossiers ?? []).map((d) => d.id)

  const [{ data: pieces }, { data: rappels }, { data: rappelsUrgents }] = await Promise.all([
    ids.length
      ? supabase
          .from('pieces_dossier')
          .select('dossier_id')
          .in('dossier_id', ids)
          .eq('recu', false)
      : Promise.resolve({ data: [] as { dossier_id: string }[] }),
    ids.length
      ? supabase
          .from('rappels')
          .select('dossier_id, date_rappel')
          .in('dossier_id', ids)
          .neq('statut', 'realise')
          .order('date_rappel', { ascending: true })
      : Promise.resolve({ data: [] as { dossier_id: string; date_rappel: string }[] }),
    ids.length
      ? supabase
          .from('rappels')
          .select('id, dossier_id, type_rappel, date_rappel')
          .in('dossier_id', ids)
          .neq('statut', 'realise')
          .gte('date_rappel', todayStr)
          .lte('date_rappel', in7DaysStr)
          .order('date_rappel', { ascending: true })
      : Promise.resolve({
          data: [] as { id: string; dossier_id: string; type_rappel: string; date_rappel: string }[],
        }),
  ])

  // Nombre de pièces manquantes par dossier
  const piecesMap = new Map<string, number>()
  for (const p of pieces ?? []) {
    piecesMap.set(p.dossier_id, (piecesMap.get(p.dossier_id) ?? 0) + 1)
  }

  // Urgence la plus critique par dossier (premier rappel = plus proche car trié ASC)
  const urgenceMap = new Map<string, StatutRappel>()
  for (const r of rappels ?? []) {
    if (!urgenceMap.has(r.dossier_id)) {
      urgenceMap.set(r.dossier_id, getStatutRappel(r.date_rappel))
    }
  }

  // Sort by pieces_manquantes after fetch
  let sortedDossiers = dossiers ?? []
  if (tri === 'pieces_manquantes') {
    sortedDossiers = [...sortedDossiers].sort(
      (a, b) => (piecesMap.get(b.id) ?? 0) - (piecesMap.get(a.id) ?? 0),
    )
  }

  // Stats for StatsBanner (always from unfiltered perspective — use all)
  const dossiersEnCours = (dossiers ?? []).filter((d) => d.statut === 'en_cours').length
  const signaturesThisMois = (dossiers ?? []).filter(
    (d) => d.date_signature >= monthStart && d.date_signature < nextMonthStart,
  ).length
  const piecesManquantesTotal = pieces?.length ?? 0
  const alertesActives = (rappels ?? []).filter((r) => {
    const s = getStatutRappel(r.date_rappel)
    return s === 'critique' || s === 'depasse'
  }).length

  // Dossier reference map for AlertesWidget
  const dossierRefMap = new Map((dossiers ?? []).map((d) => [d.id, d.reference]))

  const alerteItems: AlerteItem[] = (rappelsUrgents ?? []).map((r) => ({
    rappelId: r.id,
    dossierId: r.dossier_id,
    dossierReference: dossierRefMap.get(r.dossier_id) ?? '',
    typeRappel: r.type_rappel as TypeRappel,
    dateRappel: r.date_rappel,
    statut: getStatutRappel(r.date_rappel),
  }))

  const signatureItems: SignatureItem[] = (dossiers ?? []).map((d) => ({
    dossierId: d.id,
    reference: d.reference,
    dateSignature: d.date_signature,
    urgence: urgenceMap.get(d.id) ?? null,
  }))

  async function logout() {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const total = sortedDossiers.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* En-tête */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Mes dossiers</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {total} dossier{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/nouveau"
              className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
            >
              + Nouveau dossier
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <StatsBanner
          dossiersEnCours={dossiersEnCours}
          signaturesThisMois={signaturesThisMois}
          piecesManquantes={piecesManquantesTotal}
          alertesActives={alertesActives}
        />

        {/* Widgets alertes + calendrier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <AlertesWidget alertes={alerteItems} />
          <CalendrierSignatures signatures={signatureItems} />
        </div>

        {/* Filtres */}
        <Suspense fallback={null}>
          <FiltresDossiers />
        </Suspense>

        {/* Liste des dossiers */}
        {total === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg mb-4">
              {q || statut || type_acte || mois
                ? 'Aucun dossier ne correspond aux filtres.'
                : 'Aucun dossier pour le moment.'}
            </p>
            {!q && !statut && !type_acte && !mois && (
              <Link
                href="/dashboard/nouveau"
                className="inline-flex items-center justify-center rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
              >
                Créer le premier dossier
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedDossiers.map((dossier) => (
              <DossierCard
                key={dossier.id}
                dossier={dossier}
                piecesManquantes={piecesMap.get(dossier.id) ?? 0}
                urgence={urgenceMap.get(dossier.id) ?? null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
