'use client'

import { useState } from 'react'
import PieceRow from './PieceRow'
import type { PieceDossier, CategoriePiece } from '@/types'

const CATEGORIES: { value: CategoriePiece | 'toutes' | 'manquantes'; label: string }[] = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'manquantes', label: 'Manquantes' },
  { value: 'vendeur', label: 'Vendeur' },
  { value: 'acquereur', label: 'Acquéreur' },
  { value: 'bien', label: 'Bien' },
  { value: 'financement', label: 'Financement' },
  { value: 'admin', label: 'Admin' },
  { value: 'succession', label: 'Succession' },
  { value: 'promoteur', label: 'Promoteur' },
]

interface PiecesChecklistProps {
  pieces: PieceDossier[]
}

export default function PiecesChecklist({ pieces }: PiecesChecklistProps) {
  const [filter, setFilter] = useState<CategoriePiece | 'toutes' | 'manquantes'>('toutes')

  const total = pieces.length
  const recues = pieces.filter((p) => p.recu).length
  const pct = total > 0 ? Math.round((recues / total) * 100) : 0

  // Filtrer les catégories présentes
  const presentCategories = new Set(pieces.map((p) => p.categorie))
  const visibleFilters = CATEGORIES.filter(
    (c) => c.value === 'toutes' || c.value === 'manquantes' || presentCategories.has(c.value as CategoriePiece)
  )

  const filtered = pieces.filter((p) => {
    if (filter === 'toutes') return true
    if (filter === 'manquantes') return !p.recu
    return p.categorie === filter
  })

  return (
    <div className="space-y-4">
      {/* Barre de progression */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {recues} / {total} pièces reçues
          </span>
          <span
            className={`font-semibold ${
              pct === 100 ? 'text-green-700' : pct >= 60 ? 'text-amber-700' : 'text-red-600'
            }`}
          >
            {pct} %
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5">
        {visibleFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
            {f.value === 'manquantes' && (
              <span className="ml-1 opacity-70">({pieces.filter((p) => !p.recu).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          {filter === 'manquantes' ? 'Toutes les pièces sont reçues !' : 'Aucune pièce dans cette catégorie.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((piece) => (
            <PieceRow key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </div>
  )
}
