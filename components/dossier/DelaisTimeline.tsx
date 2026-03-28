'use client'

import { useState } from 'react'
import { formatDate, getStatutRappel } from '@/lib/dates'
import type { Rappel, StatutRappel, TypeRappel } from '@/types'

const TYPE_RAPPEL_LABELS: Record<TypeRappel, string> = {
  purge_dpu_envoi_dia: 'Envoi DIA — Purge DPU',
  purge_dpu_fin_delai: 'Fin délai DPU',
  purge_safer: 'Purge SAFER',
  purge_droit_locataire: 'Purge droit locataire',
  retractation_sru_fin: 'Fin rétractation SRU',
  reflexion_sru_fin: 'Fin délai réflexion SRU',
  condition_suspensive_pret: 'Condition suspensive prêt',
  acceptation_offre_pret: 'Acceptation offre de prêt',
  reflexion_vefa: 'Délai réflexion VEFA',
  declaration_succession: 'Déclaration de succession',
  signature_imminente: 'Signature imminente',
  rappel_signature: 'Rappel signature',
  relance_pieces_manquantes: 'Relance pièces manquantes',
}

const STATUT_CONFIG: Record<StatutRappel, { label: string; className: string }> = {
  a_faire: { label: 'À faire', className: 'bg-slate-100 text-slate-500' },
  en_cours: { label: 'À surveiller', className: 'bg-blue-50 text-blue-700' },
  alerte: { label: 'Alerte', className: 'bg-amber-100 text-amber-700' },
  critique: { label: 'Critique', className: 'bg-red-100 text-red-700 font-semibold' },
  realise: { label: 'Réalisé', className: 'bg-green-100 text-green-700' },
  depasse: { label: 'Dépassé !', className: 'bg-red-200 text-red-900 font-semibold' },
}

function getEffectifStatut(rappel: Rappel): StatutRappel {
  if (rappel.statut === 'realise') return 'realise'
  return getStatutRappel(rappel.date_rappel)
}

interface DelaisTimelineProps {
  rappels: Rappel[]
}

export default function DelaisTimeline({ rappels: initialRappels }: DelaisTimelineProps) {
  const [rappels, setRappels] = useState(initialRappels)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)

  async function marquerRealise(id: string) {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/rappels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'realise' }),
      })
      if (res.ok) {
        const { rappel } = await res.json()
        setRappels((prev) => prev.map((r) => (r.id === id ? rappel : r)))
      }
    } finally {
      setLoadingId(null)
    }
  }

  async function envoyerEmail(id: string) {
    setSendingId(id)
    try {
      const res = await fetch('/api/rappels/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rappel_id: id }),
      })
      if (res.ok) {
        const { rappel } = await res.json()
        setRappels((prev) => prev.map((r) => (r.id === id ? rappel : r)))
      }
    } finally {
      setSendingId(null)
    }
  }

  if (rappels.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        Aucun délai calculable pour ce dossier.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type de délai
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Statut
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rappels.map((rappel) => {
            const statut = getEffectifStatut(rappel)
            const config = STATUT_CONFIG[statut]
            const isRealise = statut === 'realise'
            const isLoading = loadingId === rappel.id

            return (
              <tr
                key={rappel.id}
                className={`transition-colors ${isRealise ? 'opacity-50' : 'hover:bg-slate-50/60'}`}
              >
                <td className="px-4 py-3 font-medium text-slate-700">
                  {TYPE_RAPPEL_LABELS[rappel.type_rappel]}
                  {rappel.envoye && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                      ✉ envoyé
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">
                  {formatDate(rappel.date_rappel)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${config.className}`}
                  >
                    {config.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {!isRealise && (
                    <>
                      <button
                        onClick={() => envoyerEmail(rappel.id)}
                        disabled={sendingId === rappel.id || rappel.envoye}
                        className="text-xs text-slate-400 hover:text-blue-700 transition-colors disabled:opacity-40"
                        title={rappel.envoye ? 'Email déjà envoyé' : 'Envoyer un email de rappel'}
                      >
                        {sendingId === rappel.id ? 'Envoi…' : '✉ Email'}
                      </button>
                      <button
                        onClick={() => marquerRealise(rappel.id)}
                        disabled={isLoading}
                        className="text-xs text-slate-400 hover:text-green-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Enregistrement…' : 'Marquer réalisé'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
