import Link from 'next/link'
import DossierForm from '@/components/dossier/DossierForm'

export default function NouveauDossierPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-slate-700 transition-colors text-sm"
          >
            ← Mes dossiers
          </Link>
          <span className="text-slate-200">/</span>
          <h1 className="text-lg font-semibold text-slate-900">Nouveau dossier</h1>
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
          <DossierForm />
        </div>
      </main>
    </div>
  )
}
