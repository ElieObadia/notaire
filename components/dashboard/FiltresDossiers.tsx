'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { TypeActe, StatutDossier } from '@/types'

const TYPE_ACTE_OPTIONS: { value: TypeActe; label: string }[] = [
  { value: 'compromis_vente', label: 'Compromis de vente' },
  { value: 'promesse_vente', label: 'Promesse de vente' },
  { value: 'vente_simple', label: 'Vente simple' },
  { value: 'vefa', label: 'VEFA' },
  { value: 'vente_viager', label: 'Vente en viager' },
  { value: 'donation_immobiliere', label: 'Donation immobilière' },
  { value: 'donation_partage', label: 'Donation-partage' },
  { value: 'succession_immo', label: 'Succession immobilière' },
  { value: 'pret_hypothecaire', label: 'Prêt hypothécaire' },
  { value: 'mainlevee', label: 'Mainlevée' },
  { value: 'bail_emphyteotique', label: 'Bail emphytéotique' },
  { value: 'servitude', label: 'Servitude' },
  { value: 'etat_descriptif', label: 'État descriptif' },
  { value: 'reglement_copropriete', label: 'Règlement de copropriété' },
]

const STATUT_OPTIONS: { value: StatutDossier; label: string }[] = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'signe', label: 'Signé' },
  { value: 'archive', label: 'Archivé' },
]

const TRI_OPTIONS = [
  { value: 'date_signature', label: 'Trier : date de signature' },
  { value: 'reference', label: 'Trier : référence' },
  { value: 'pieces_manquantes', label: 'Trier : pièces manquantes' },
]

export default function FiltresDossiers() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const q = searchParams.get('q') ?? ''
  const statut = searchParams.get('statut') ?? ''
  const typeActe = searchParams.get('type_acte') ?? ''
  const mois = searchParams.get('mois') ?? ''
  const tri = searchParams.get('tri') ?? 'date_signature'

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname],
  )

  const hasFilters = q || statut || typeActe || mois

  return (
    <div className="mb-6 space-y-2">
      {/* Barre de recherche */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => update('q', e.target.value)}
          placeholder="Rechercher par référence, vendeur, acquéreur, adresse…"
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
        />
      </div>

      {/* Filtres + tri */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statut}
          onChange={(e) => update('statut', e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          {STATUT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={typeActe}
          onChange={(e) => update('type_acte', e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        >
          <option value="">Tous les types d&apos;acte</option>
          {TYPE_ACTE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={mois}
          onChange={(e) => update('mois', e.target.value)}
          title="Mois de signature"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        />

        <div className="ml-auto flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={() => router.push(pathname)}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors underline"
            >
              Réinitialiser
            </button>
          )}
          <select
            value={tri}
            onChange={(e) => update('tri', e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
          >
            {TRI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
