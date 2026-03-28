import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DossierForm from '@/components/dossier/DossierForm'
import type { Dossier } from '@/types'

export default async function ModifierDossierPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dossier } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!dossier) notFound()

  const d = dossier as Dossier

  const initialValues = {
    reference: d.reference,
    type_acte: d.type_acte,
    date_signature: d.date_signature,
    date_compromis: d.date_compromis ?? '',
    vendeur_nom: d.vendeur_nom ?? '',
    acquereur_nom: d.acquereur_nom ?? '',
    adresse_bien: d.adresse_bien ?? '',
    prix_vente: d.prix_vente != null ? String(d.prix_vente) : '',
    notes: d.notes ?? '',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href={`/dashboard/${d.id}`}
            className="text-slate-400 hover:text-slate-700 transition-colors text-sm"
          >
            ← {d.reference}
          </Link>
          <span className="text-slate-200">/</span>
          <h1 className="text-lg font-semibold text-slate-900">Modifier le dossier</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">Informations du dossier</h2>
            <p className="text-sm text-slate-500 mt-1">
              Les champs marqués <span className="text-red-500">*</span> sont obligatoires.
            </p>
          </div>
          <DossierForm dossierId={d.id} initialValues={initialValues} />
        </div>
      </main>
    </div>
  )
}
