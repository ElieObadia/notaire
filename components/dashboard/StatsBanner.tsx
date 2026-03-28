interface Props {
  dossiersEnCours: number
  signaturesThisMois: number
  piecesManquantes: number
  alertesActives: number
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

export default function StatsBanner({
  dossiersEnCours,
  signaturesThisMois,
  piecesManquantes,
  alertesActives,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard label="Dossiers en cours" value={dossiersEnCours} />
      <StatCard label="Signatures ce mois" value={signaturesThisMois} />
      <StatCard
        label="Pièces manquantes"
        value={piecesManquantes}
        accent={piecesManquantes > 0 ? 'text-amber-600' : undefined}
      />
      <StatCard
        label="Alertes actives"
        value={alertesActives}
        accent={alertesActives > 0 ? 'text-red-600' : undefined}
      />
    </div>
  )
}
