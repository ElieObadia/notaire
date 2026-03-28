'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { StatutRappel } from '@/types'

export interface SignatureItem {
  dossierId: string
  reference: string
  dateSignature: string
  urgence: StatutRappel | null
}

interface Props {
  signatures: SignatureItem[]
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DOT: Record<StatutRappel | 'none', string> = {
  critique: 'bg-red-500',
  depasse: 'bg-red-800',
  alerte: 'bg-amber-500',
  en_cours: 'bg-blue-500',
  a_faire: 'bg-slate-400',
  realise: 'bg-green-500',
  none: 'bg-slate-400',
}

export default function CalendrierSignatures({ signatures }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed

  const todayStr = now.toISOString().split('T')[0]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-first: 0=Mon … 6=Sun
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const totalCells = firstDayOffset + daysInMonth
  const rows = Math.ceil(totalCells / 7)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // Index signatures by date
  const sigMap = new Map<string, SignatureItem[]>()
  for (const s of signatures) {
    const list = sigMap.get(s.dateSignature) ?? []
    list.push(s)
    sigMap.set(s.dateSignature, list)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Calendrier des signatures</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg leading-none"
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-slate-700 w-36 text-center tabular-nums">
            {MOIS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg leading-none"
            aria-label="Mois suivant"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {JOURS.map((j) => (
          <div key={j} className="text-center text-xs font-medium text-slate-400 py-1">
            {j}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-lg overflow-hidden">
        {Array.from({ length: rows * 7 }).map((_, i) => {
          const dayNum = i - firstDayOffset + 1
          if (dayNum < 1 || dayNum > daysInMonth) {
            return <div key={i} className="bg-slate-50 min-h-[52px]" />
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          const daySigs = sigMap.get(dateStr) ?? []
          const isToday = dateStr === todayStr

          return (
            <div
              key={i}
              className={`bg-white min-h-[52px] p-1 ${isToday ? 'ring-1 ring-inset ring-blue-400' : ''}`}
            >
              <p className={`text-xs text-right mb-0.5 ${isToday ? 'font-bold text-blue-700' : 'text-slate-400'}`}>
                {dayNum}
              </p>
              {daySigs.length > 0 && (
                <div className="space-y-0.5">
                  {daySigs.slice(0, 2).map((s) => (
                    <Link
                      key={s.dossierId}
                      href={`/dashboard/${s.dossierId}`}
                      className="flex items-center gap-1 group"
                      title={s.reference}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[s.urgence ?? 'none']}`} />
                      <span className="text-xs text-slate-600 group-hover:text-blue-700 truncate leading-none">
                        {s.reference}
                      </span>
                    </Link>
                  ))}
                  {daySigs.length > 2 && (
                    <p className="text-xs text-slate-400 pl-2.5">+{daySigs.length - 2}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
        {([
          ['bg-red-500', 'Critique'],
          ['bg-amber-500', 'Alerte'],
          ['bg-blue-500', 'En cours'],
          ['bg-slate-400', 'À faire'],
        ] as const).map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
