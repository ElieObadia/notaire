import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/dates'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PiecesChecklist from '@/components/dossier/PiecesChecklist'
import DelaisTimeline from '@/components/dossier/DelaisTimeline'
import StatutSelect from '@/components/dossier/StatutSelect'
import ExportPdfButton from '@/components/dossier/ExportPdfButton'
import DeleteDossierButton from '@/components/dossier/DeleteDossierButton'
import type { Dossier, PieceDossier, Rappel, StatutDossier, TypeActe } from '@/types'

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

const STATUT_BADGE: Record<StatutDossier, { label: string; className: string }> = {
  en_cours: { label: 'En cours', className: 'bg-slate-100 text-slate-700' },
  signe: { label: 'Signé', className: 'bg-green-100 text-green-700' },
  archive: { label: 'Archivé', className: 'bg-slate-200 text-slate-500' },
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

export default async function DossierDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: dossier }, { data: pieces }, { data: rappels }] = await Promise.all([
    supabase.from('dossiers').select('*').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('pieces_dossier').select('*').eq('dossier_id', params.id).order('categorie'),
    supabase.from('rappels').select('*').eq('dossier_id', params.id).order('date_rappel', { ascending: true }),
  ])

  if (!dossier) notFound()

  const d = dossier as Dossier
  const statutBadge = STATUT_BADGE[d.statut]
  const partyLabels = getPartyLabels(d.type_acte)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* En-tête */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            ← Mes dossiers
          </Link>
          <div className="flex items-center gap-2">
            <ExportPdfButton
              dossier={d}
              pieces={(pieces ?? []) as PieceDossier[]}
              rappels={(rappels ?? []) as Rappel[]}
            />
            <StatutSelect dossierId={d.id} statut={d.statut} />
            <Link
              href={`/dashboard/${d.id}/modifier`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Modifier
            </Link>
            <DeleteDossierButton dossierId={d.id} reference={d.reference} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Fiche dossier */}
        <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 space-y-4">
          {/* Référence + type + statut */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-blue-900">{d.reference}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{TYPE_ACTE_LABELS[d.type_acte]}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statutBadge.className}`}
            >
              {statutBadge.label}
            </span>
          </div>

          {/* Grille infos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 pt-2 border-t border-slate-50 text-sm">
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-400">Date de signature</span>
              <p className="font-medium text-slate-800 mt-0.5">{formatDate(d.date_signature)}</p>
            </div>
            {d.date_compromis && (
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400">Date de compromis</span>
                <p className="font-medium text-slate-800 mt-0.5">{formatDate(d.date_compromis)}</p>
              </div>
            )}
            {d.vendeur_nom && (
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400">{partyLabels.from}</span>
                <p className="font-medium text-slate-800 mt-0.5">{d.vendeur_nom}</p>
              </div>
            )}
            {d.acquereur_nom && (
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400">{partyLabels.to}</span>
                <p className="font-medium text-slate-800 mt-0.5">{d.acquereur_nom}</p>
              </div>
            )}
            {d.adresse_bien && (
              <div className="sm:col-span-2">
                <span className="text-xs uppercase tracking-wide text-slate-400">Adresse du bien</span>
                <p className="font-medium text-slate-800 mt-0.5">{d.adresse_bien}</p>
              </div>
            )}
            {d.prix_vente != null && (
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400">Prix / Valeur</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(d.prix_vente)}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {d.notes && (
            <div className="pt-3 border-t border-slate-50">
              <span className="text-xs uppercase tracking-wide text-slate-400">Notes</span>
              <p className="text-slate-600 text-sm mt-1 whitespace-pre-wrap">{d.notes}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pieces">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="pieces">
              Pièces justificatives
              <span className="ml-1.5 text-xs opacity-60">
                ({(pieces ?? []).filter((p: PieceDossier) => p.recu).length}/{(pieces ?? []).length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="delais">
              Délais & Rappels
              <span className="ml-1.5 text-xs opacity-60">({(rappels ?? []).length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pieces" className="mt-4">
            <PiecesChecklist pieces={(pieces ?? []) as PieceDossier[]} />
          </TabsContent>

          <TabsContent value="delais" className="mt-4">
            <DelaisTimeline rappels={(rappels ?? []) as Rappel[]} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
