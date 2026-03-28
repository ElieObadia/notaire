'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteDossierButton({ dossierId, reference }: { dossierId: string; reference: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/dossiers/${dossierId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setLoading(false)
      setConfirming(false)
      alert('Erreur lors de la suppression.')
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Supprimer «&nbsp;{reference}&nbsp;» ?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Suppression…' : 'Confirmer'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
    >
      Supprimer
    </button>
  )
}
