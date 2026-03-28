'use client'

import { useState } from 'react'
import type { Dossier, PieceDossier, Rappel, CategoriePiece, TypeActe } from '@/types'

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

const CATEGORIE_LABELS: Record<CategoriePiece, string> = {
  vendeur: 'Vendeur',
  acquereur: 'Acquéreur',
  bien: 'Bien',
  financement: 'Financement',
  admin: 'Admin',
  succession: 'Succession',
  promoteur: 'Promoteur',
}

const TYPE_RAPPEL_LABELS: Record<string, string> = {
  purge_dpu_envoi_dia: 'Envoi DIA — purge DPU',
  purge_dpu_fin_delai: 'Fin délai purge DPU',
  purge_safer: 'Purge SAFER',
  purge_droit_locataire: 'Purge droit du locataire',
  retractation_sru_fin: 'Fin délai rétractation SRU',
  reflexion_sru_fin: 'Fin délai réflexion SRU',
  condition_suspensive_pret: 'Condition suspensive prêt',
  acceptation_offre_pret: 'Acceptation offre de prêt',
  reflexion_vefa: 'Délai réflexion VEFA',
  declaration_succession: 'Déclaration de succession',
  signature_imminente: 'Signature imminente (J-7)',
  rappel_signature: 'Rappel signature (J-1)',
  relance_pieces_manquantes: 'Relance pièces manquantes',
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

interface Props {
  dossier: Dossier
  pieces: PieceDossier[]
  rappels: Rappel[]
}

export default function ExportPdfButton({ dossier, pieces, rappels }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 16
      const contentWidth = pageWidth - margin * 2
      let y = margin

      // ── En-tête ──────────────────────────────────────────────────
      doc.setFillColor(30, 58, 138) // blue-900
      doc.rect(0, 0, pageWidth, 28, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Checklist dossier', margin, 12)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(dossier.reference, margin, 20)
      doc.text(TYPE_ACTE_LABELS[dossier.type_acte], margin + 50, 20)

      doc.setTextColor(200, 210, 255)
      doc.setFontSize(8)
      doc.text(`Généré le ${fmt(new Date().toISOString().split('T')[0])}`, pageWidth - margin, 24, { align: 'right' })

      y = 36

      // ── Infos dossier ─────────────────────────────────────────────
      doc.setTextColor(30, 41, 59) // slate-800
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      const infoLines: string[] = []
      infoLines.push(`Date de signature : ${fmt(dossier.date_signature)}`)
      if (dossier.date_compromis) infoLines.push(`Date de compromis : ${fmt(dossier.date_compromis)}`)
      if (dossier.vendeur_nom) infoLines.push(`Vendeur / Donateur : ${dossier.vendeur_nom}`)
      if (dossier.acquereur_nom) infoLines.push(`Acquéreur / Donataire : ${dossier.acquereur_nom}`)
      if (dossier.adresse_bien) infoLines.push(`Adresse du bien : ${dossier.adresse_bien}`)
      if (dossier.prix_vente != null)
        infoLines.push(
          `Prix / Valeur : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(dossier.prix_vente)}`,
        )

      const cols = [infoLines.slice(0, Math.ceil(infoLines.length / 2)), infoLines.slice(Math.ceil(infoLines.length / 2))]
      const colWidth = contentWidth / 2

      cols.forEach((col, ci) => {
        col.forEach((line, li) => {
          doc.text(line, margin + ci * colWidth, y + li * 5)
        })
      })

      y += Math.max(cols[0].length, cols[1].length) * 5 + 6

      // ── Pièces justificatives ─────────────────────────────────────
      // Grouper par catégorie
      const byCategorie = new Map<CategoriePiece, PieceDossier[]>()
      for (const p of pieces) {
        if (!byCategorie.has(p.categorie)) byCategorie.set(p.categorie, [])
        byCategorie.get(p.categorie)!.push(p)
      }

      const drawSectionTitle = (title: string) => {
        if (y > 270) {
          doc.addPage()
          y = margin
        }
        doc.setFillColor(241, 245, 249) // slate-100
        doc.rect(margin, y, contentWidth, 7, 'F')
        doc.setTextColor(30, 58, 138)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(title, margin + 2, y + 5)
        y += 10
      }

      const drawPieceRow = (piece: PieceDossier) => {
        if (y > 275) {
          doc.addPage()
          y = margin
        }
        doc.setDrawColor(148, 163, 184)
        doc.setFillColor(piece.recu ? 34 : 255, piece.recu ? 197 : 255, piece.recu ? 94 : 255)
        doc.roundedRect(margin, y - 3, 4, 4, 0.5, 0.5, piece.recu ? 'FD' : 'D')

        doc.setTextColor(piece.recu ? 100 : 30, piece.recu ? 116 : 41, piece.recu ? 139 : 59)
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')

        const nameX = margin + 7
        const nameMaxWidth = contentWidth - 40

        const wrapped = doc.splitTextToSize(piece.nom, nameMaxWidth)
        doc.text(wrapped, nameX, y)

        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        const catLabel: string = CATEGORIE_LABELS[piece.categorie] ?? piece.categorie
        doc.text(catLabel, pageWidth - margin, y, { align: 'right' })

        const lineHeight = wrapped.length * 3.5
        if (piece.recu && piece.date_reception) {
          doc.setTextColor(71, 85, 105)
          doc.setFontSize(7)
          doc.text(`Reçu le ${fmt(piece.date_reception)}`, nameX, y + lineHeight)
          y += lineHeight + 2
        } else {
          y += lineHeight
        }
        y += 4
      }

      drawSectionTitle('Pièces justificatives')

      for (const categorie of Array.from(byCategorie.keys())) {
        const catPieces = byCategorie.get(categorie)!
        if (y > 270) { doc.addPage(); y = margin }

        doc.setTextColor(71, 85, 105)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        const catLabel: string = CATEGORIE_LABELS[categorie] ?? categorie
        doc.text(catLabel.toUpperCase(), margin, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        for (const piece of catPieces) {
          drawPieceRow(piece)
        }
        y += 2
      }

      // ── Délais légaux ─────────────────────────────────────────────
      if (rappels.length > 0) {
        drawSectionTitle('Délais & Rappels')

        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')

        for (const rappel of rappels) {
          if (y > 275) { doc.addPage(); y = margin }

          const label = TYPE_RAPPEL_LABELS[rappel.type_rappel] ?? rappel.type_rappel
          const dateStr = fmt(rappel.date_rappel)
          const statutStr = rappel.statut === 'realise' ? 'Réalisé' : rappel.envoye ? 'Envoyé' : rappel.statut

          // Color by statut
          if (rappel.statut === 'realise') doc.setTextColor(34, 197, 94)
          else if (rappel.statut === 'critique' || rappel.statut === 'depasse') doc.setTextColor(220, 38, 38)
          else if (rappel.statut === 'alerte') doc.setTextColor(217, 119, 6)
          else doc.setTextColor(71, 85, 105)

          doc.text(`• ${label}`, margin + 2, y)
          doc.text(dateStr, margin + contentWidth * 0.65, y)
          doc.text(statutStr, pageWidth - margin, y, { align: 'right' })

          doc.setTextColor(200, 210, 220)
          doc.setDrawColor(226, 232, 240)
          doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5)

          y += 6
        }
      }

      // ── Footer ────────────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setTextColor(148, 163, 184)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `${dossier.reference} — Page ${i}/${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' },
        )
      }

      const today = new Date().toISOString().split('T')[0]
      doc.save(`checklist-${dossier.reference}-${today}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          Export…
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporter PDF
        </span>
      )}
    </button>
  )
}
