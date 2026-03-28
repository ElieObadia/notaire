import Link from 'next/link'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { formatDate } from '@/lib/dates'
import type { Dossier, StatutDossier, StatutRappel, TypeActe } from '@/types'

const TYPE_ACTE_LABELS: Record<TypeActe, string> = {
  compromis_vente: 'Compromis de vente',
  promesse_vente: 'Promesse de vente',
  vente_simple: 'Vente simple',
  vefa: 'VEFA',
  vente_viager: 'Vente en viager',
  donation_immobiliere: 'Donation immobilière',
  donation_partage: 'Donation-partage',
  succession_immo: 'Succession immobilière',
  pret_hypothecaire: 'Prêt hypothécaire',
  mainlevee: 'Mainlevée',
  bail_emphyteotique: 'Bail emphytéotique',
  servitude: 'Servitude',
  etat_descriptif: 'État descriptif de division',
  reglement_copropriete: 'Règlement de copropriété',
}

const STATUT_CONFIG: Record<StatutDossier, { label: string; className: string }> = {
  en_cours: { label: 'En cours', className: 'bg-slate-100 text-slate-700' },
  signe: { label: 'Signé', className: 'bg-green-100 text-green-700' },
  archive: { label: 'Archivé', className: 'bg-slate-200 text-slate-500' },
}

const URGENCE_CONFIG: Record<StatutRappel, { label: string; className: string }> = {
  a_faire: { label: 'RAS', className: 'bg-slate-100 text-slate-500' },
  en_cours: { label: 'À surveiller', className: 'bg-blue-50 text-blue-700' },
  alerte: { label: 'Alerte', className: 'bg-amber-100 text-amber-700' },
  critique: { label: 'Critique', className: 'bg-red-100 text-red-700' },
  depasse: { label: 'Dépassé !', className: 'bg-red-200 text-red-900 font-semibold' },
  realise: { label: 'Réalisé', className: 'bg-green-100 text-green-700' },
}

function getPartyLabels(typeActe: TypeActe): { from: string; to: string } {
  switch (typeActe) {
    case 'donation_immobiliere':
    case 'donation_partage':
      return { from: 'Donateur', to: 'Donataire' }
    case 'succession_immo':
      return { from: 'Défunt', to: 'Héritiers' }
    case 'pret_hypothecaire':
      return { from: 'Emprunteur', to: 'Prêteur' }
    case 'bail_emphyteotique':
      return { from: 'Bailleur', to: 'Preneur' }
    default:
      return { from: 'Vendeur', to: 'Acquéreur' }
  }
}

interface DossierCardProps {
  dossier: Dossier
  piecesManquantes: number
  urgence: StatutRappel | null
}

export default function DossierCard({ dossier, piecesManquantes, urgence }: DossierCardProps) {
  const isInactive = dossier.statut === 'signe' || dossier.statut === 'archive'
  const statutConfig = STATUT_CONFIG[dossier.statut]
  const partyLabels = getPartyLabels(dossier.type_acte)

  return (
    <Link href={`/dashboard/${dossier.id}`} className="block group">
      <Card
        className={`h-full transition-shadow group-hover:shadow-md cursor-pointer${
          isInactive ? ' opacity-60' : ''
        }`}
      >
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-blue-900 font-semibold truncate">
                {dossier.reference}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {TYPE_ACTE_LABELS[dossier.type_acte]}
              </CardDescription>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${statutConfig.className}`}
            >
              {statutConfig.label}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 py-3">
          {/* Parties */}
          <div className="text-sm space-y-0.5">
            {dossier.vendeur_nom && (
              <div className="text-slate-700">
                <span className="text-slate-400 text-xs uppercase tracking-wide mr-1">
                  {partyLabels.from}
                </span>
                {dossier.vendeur_nom}
              </div>
            )}
            {dossier.acquereur_nom && (
              <div className="text-slate-700">
                <span className="text-slate-400 text-xs uppercase tracking-wide mr-1">
                  {partyLabels.to}
                </span>
                {dossier.acquereur_nom}
              </div>
            )}
          </div>

          {/* Adresse */}
          {dossier.adresse_bien && (
            <div className="text-sm text-slate-500 truncate" title={dossier.adresse_bien}>
              {dossier.adresse_bien}
            </div>
          )}

          {/* Date signature */}
          <div className="text-sm font-medium text-slate-800">
            Signature :{' '}
            <span className="text-blue-800">{formatDate(dossier.date_signature)}</span>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 py-2.5">
          {/* Pièces manquantes */}
          <span
            className={`text-xs font-medium ${
              piecesManquantes > 0 ? 'text-amber-700' : 'text-green-700'
            }`}
          >
            {piecesManquantes > 0
              ? `${piecesManquantes} pièce${piecesManquantes > 1 ? 's' : ''} manquante${piecesManquantes > 1 ? 's' : ''}`
              : '✓ Dossier complet'}
          </span>

          {/* Badge urgence */}
          {urgence && urgence !== 'a_faire' && urgence !== 'realise' && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${URGENCE_CONFIG[urgence].className}`}
            >
              {URGENCE_CONFIG[urgence].label}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
