'use client'

import { useState, useRef } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDate } from '@/lib/dates'
import type { PieceDossier, CategoriePiece } from '@/types'

const CATEGORIE_LABELS: Record<CategoriePiece, string> = {
  vendeur: 'Vendeur',
  acquereur: 'Acquéreur',
  bien: 'Bien',
  financement: 'Financement',
  admin: 'Admin',
  succession: 'Succession',
  promoteur: 'Promoteur',
}

const CATEGORIE_COLORS: Record<CategoriePiece, string> = {
  vendeur: 'bg-blue-50 text-blue-700',
  acquereur: 'bg-purple-50 text-purple-700',
  bien: 'bg-amber-50 text-amber-700',
  financement: 'bg-green-50 text-green-700',
  admin: 'bg-slate-100 text-slate-600',
  succession: 'bg-orange-50 text-orange-700',
  promoteur: 'bg-teal-50 text-teal-700',
}

function getValiditeInfo(piece: PieceDossier): { label: string; className: string } | null {
  if (!piece.validite_mois || !piece.date_reception) return null
  const reception = new Date(piece.date_reception + 'T00:00:00Z')
  const expiry = new Date(reception)
  expiry.setUTCMonth(expiry.getUTCMonth() + piece.validite_mois)
  const now = new Date()
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / 86_400_000)
  if (diffDays < 0) {
    return { label: `Expiré (${formatDate(expiry.toISOString().split('T')[0])})`, className: 'text-red-600' }
  }
  if (diffDays <= 30) {
    return { label: `Expire dans ${diffDays}j`, className: 'text-amber-600' }
  }
  return { label: `Valide jusqu'au ${formatDate(expiry.toISOString().split('T')[0])}`, className: 'text-green-700' }
}

interface PieceRowProps {
  piece: PieceDossier
}

export default function PieceRow({ piece: initialPiece }: PieceRowProps) {
  const [piece, setPiece] = useState(initialPiece)
  const [saving, setSaving] = useState(false)
  const commentRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function toggleRecu(checked: boolean) {
    setPiece((p) => ({ ...p, recu: checked }))
    setSaving(true)
    try {
      const body: Record<string, unknown> = { recu: checked }
      if (checked && !piece.date_reception) {
        const today = new Date().toISOString().split('T')[0]
        body.date_reception = today
        setPiece((p) => ({ ...p, date_reception: today }))
      }
      const res = await fetch(`/api/pieces/${piece.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setPiece((p) => ({ ...p, recu: !checked }))
      } else {
        const { piece: updated } = await res.json()
        setPiece(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  function onCommentChange(value: string) {
    setPiece((p) => ({ ...p, commentaire: value }))
    if (commentRef.current) clearTimeout(commentRef.current)
    commentRef.current = setTimeout(async () => {
      await fetch(`/api/pieces/${piece.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentaire: value }),
      })
    }, 500)
  }

  const validiteInfo = getValiditeInfo(piece)

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
        piece.recu ? 'border-green-100 bg-green-50/40' : 'border-slate-100 bg-white'
      }`}
    >
      <div className="mt-0.5">
        <Checkbox
          checked={piece.recu}
          onCheckedChange={(val: boolean) => toggleRecu(val)}
          disabled={saving}
          className="border-slate-300"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {/* Nom + badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-sm font-medium ${piece.recu ? 'text-slate-400 line-through' : 'text-slate-800'}`}
          >
            {piece.nom}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORIE_COLORS[piece.categorie]}`}
          >
            {CATEGORIE_LABELS[piece.categorie]}
          </span>
          {!piece.obligatoire && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              Optionnel
            </span>
          )}
        </div>

        {/* Date de réception + validité */}
        {piece.recu && piece.date_reception && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400">Reçu le {formatDate(piece.date_reception)}</span>
            {validiteInfo && (
              <span className={`font-medium ${validiteInfo.className}`}>{validiteInfo.label}</span>
            )}
          </div>
        )}

        {/* Commentaire inline */}
        <input
          type="text"
          value={piece.commentaire ?? ''}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Ajouter un commentaire…"
          className="w-full text-xs text-slate-500 bg-transparent border-0 border-b border-transparent focus:border-slate-200 focus:outline-none placeholder:text-slate-300 transition-colors py-0.5"
        />
      </div>
    </div>
  )
}
