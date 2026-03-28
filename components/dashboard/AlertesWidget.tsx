import Link from 'next/link'
import { formatDate } from '@/lib/dates'
import type { TypeRappel, StatutRappel } from '@/types'

export interface AlerteItem {
  rappelId: string
  dossierId: string
  dossierReference: string
  typeRappel: TypeRappel
  dateRappel: string
  statut: StatutRappel
}

interface Props {
  alertes: AlerteItem[]
}

const LABELS: Record<TypeRappel, string> = {
  purge_dpu_envoi_dia: 'Envoi DIA (purge DPU)',
  purge_dpu_fin_delai: 'Fin délai purge DPU',
  purge_safer: 'Purge SAFER',
  purge_droit_locataire: 'Purge droit locataire',
  retractation_sru_fin: 'Fin rétractation SRU',
  reflexion_sru_fin: 'Fin délai réflexion',
  condition_suspensive_pret: 'Condition suspensive prêt',
  acceptation_offre_pret: 'Acceptation offre de prêt',
  reflexion_vefa: 'Délai réflexion VEFA',
  declaration_succession: 'Déclaration de succession',
  signature_imminente: 'Signature imminente',
  rappel_signature: 'Rappel signature',
  relance_pieces_manquantes: 'Relance pièces manquantes',
}

const BADGE: Record<StatutRappel, string> = {
  critique: 'bg-red-100 text-red-700',
  depasse: 'bg-red-200 text-red-900',
  alerte: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  a_faire: 'bg-slate-100 text-slate-600',
  realise: 'bg-green-100 text-green-700',
}

const BADGE_LABEL: Record<StatutRappel, string> = {
  critique: 'Critique',
  depasse: 'Dépassé',
  alerte: 'Alerte',
  en_cours: 'En cours',
  a_faire: 'À faire',
  realise: 'Réalisé',
}

const PRIORITY: Record<StatutRappel, number> = {
  depasse: 5, critique: 4, alerte: 3, en_cours: 2, a_faire: 1, realise: 0,
}

export default function AlertesWidget({ alertes }: Props) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    .toISOString().split('T')[0]

  // Group by date, sort dates ascending
  const groupsMap = new Map<string, AlerteItem[]>()
  for (const a of alertes) {
    const list = groupsMap.get(a.dateRappel) ?? []
    list.push(a)
    groupsMap.set(a.dateRappel, list)
  }
  const groups = Array.from(groupsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      date,
      items: [...items].sort((a, b) => PRIORITY[b.statut] - PRIORITY[a.statut]),
    }))

  function dateLabel(iso: string) {
    if (iso === today) return "Aujourd'hui"
    if (iso === tomorrow) return 'Demain'
    return formatDate(iso)
  }

  const hasUrgent = alertes.some(a => a.statut === 'critique' || a.statut === 'depasse')

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">
          Alertes — 7 prochains jours
        </h2>
        {alertes.length > 0 && (
          <span className={`inline-flex items-center justify-center rounded-full text-xs w-5 h-5 font-bold ${hasUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {alertes.length}
          </span>
        )}
      </div>

      {alertes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-sm text-slate-400">Aucune alerte dans les 7 prochains jours</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-72">
          {groups.map(({ date, items }) => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {dateLabel(date)}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <Link
                    key={item.rappelId}
                    href={`/dashboard/${item.dossierId}`}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5 ${BADGE[item.statut]}`}>
                      {BADGE_LABEL[item.statut]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 group-hover:text-blue-700 truncate leading-snug">
                        {LABELS[item.typeRappel]}
                      </p>
                      <p className="text-xs text-slate-400">{item.dossierReference}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
