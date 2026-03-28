'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StatutDossier } from '@/types'

const OPTIONS: { value: StatutDossier; label: string }[] = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'signe', label: 'Signé' },
  { value: 'archive', label: 'Archivé' },
]

interface StatutSelectProps {
  dossierId: string
  statut: StatutDossier
}

export default function StatutSelect({ dossierId, statut: initialStatut }: StatutSelectProps) {
  const [statut, setStatut] = useState(initialStatut)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatut = e.target.value as StatutDossier
    setStatut(newStatut)
    setSaving(true)
    try {
      await fetch(`/api/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={statut}
      onChange={onChange}
      disabled={saving}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20 disabled:opacity-50 cursor-pointer"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
