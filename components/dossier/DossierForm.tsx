'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TypeActe } from '@/types'

const TYPE_ACTE_OPTIONS: { value: TypeActe; label: string }[] = [
  { value: 'compromis_vente', label: 'Compromis de vente' },
  { value: 'promesse_vente', label: 'Promesse de vente' },
  { value: 'vente_simple', label: 'Vente simple' },
  { value: 'vefa', label: 'VEFA (Vente en l\'état futur d\'achèvement)' },
  { value: 'vente_viager', label: 'Vente en viager' },
  { value: 'donation_immobiliere', label: 'Donation immobilière' },
  { value: 'donation_partage', label: 'Donation-partage' },
  { value: 'succession_immo', label: 'Succession immobilière' },
  { value: 'pret_hypothecaire', label: 'Prêt hypothécaire' },
  { value: 'mainlevee', label: 'Mainlevée' },
  { value: 'bail_emphyteotique', label: 'Bail emphytéotique' },
  { value: 'servitude', label: 'Servitude' },
  { value: 'etat_descriptif', label: 'État descriptif de division' },
  { value: 'reglement_copropriete', label: 'Règlement de copropriété' },
]

// Types pour lesquels la date de compromis est pertinente
const TYPES_AVEC_COMPROMIS = new Set<TypeActe>([
  'compromis_vente',
  'promesse_vente',
  'vente_simple',
  'vefa',
])

function getPartyLabels(type: TypeActe): { vendeur: string; acquereur: string } {
  switch (type) {
    case 'donation_immobiliere':
    case 'donation_partage':
      return { vendeur: 'Donateur', acquereur: 'Donataire' }
    case 'succession_immo':
      return { vendeur: 'Défunt', acquereur: 'Héritiers' }
    case 'pret_hypothecaire':
      return { vendeur: 'Emprunteur', acquereur: 'Prêteur' }
    case 'bail_emphyteotique':
      return { vendeur: 'Bailleur', acquereur: 'Preneur' }
    default:
      return { vendeur: 'Vendeur', acquereur: 'Acquéreur' }
  }
}

interface FormState {
  reference: string
  type_acte: TypeActe | ''
  date_signature: string
  date_compromis: string
  vendeur_nom: string
  acquereur_nom: string
  adresse_bien: string
  prix_vente: string
  notes: string
}

interface FormErrors {
  reference?: string
  type_acte?: string
  date_signature?: string
}

interface DossierFormProps {
  dossierId?: string
  initialValues?: Partial<FormState>
}

export default function DossierForm({ dossierId, initialValues }: DossierFormProps = {}) {
  const router = useRouter()
  const isEdit = !!dossierId
  const [form, setForm] = useState<FormState>({
    reference: '',
    type_acte: '',
    date_signature: '',
    date_compromis: '',
    vendeur_nom: '',
    acquereur_nom: '',
    adresse_bien: '',
    prix_vente: '',
    notes: '',
    ...initialValues,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const partyLabels = form.type_acte ? getPartyLabels(form.type_acte) : { vendeur: 'Vendeur', acquereur: 'Acquéreur' }
  const showCompromis = form.type_acte !== '' && TYPES_AVEC_COMPROMIS.has(form.type_acte)

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const next: FormErrors = {}
    if (!form.reference.trim()) next.reference = 'La référence est obligatoire.'
    if (!form.type_acte) next.type_acte = 'Le type d\'acte est obligatoire.'
    if (!form.date_signature) next.date_signature = 'La date de signature est obligatoire.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setServerError(null)

    const payload: Record<string, unknown> = {
      reference: form.reference.trim(),
      type_acte: form.type_acte,
      date_signature: form.date_signature,
    }
    if (showCompromis && form.date_compromis) payload.date_compromis = form.date_compromis
    if (form.vendeur_nom.trim()) payload.vendeur_nom = form.vendeur_nom.trim()
    if (form.acquereur_nom.trim()) payload.acquereur_nom = form.acquereur_nom.trim()
    if (form.adresse_bien.trim()) payload.adresse_bien = form.adresse_bien.trim()
    if (form.prix_vente.trim()) {
      const prix = parseFloat(form.prix_vente.replace(/\s/g, '').replace(',', '.'))
      if (!isNaN(prix)) payload.prix_vente = prix
    }
    if (form.notes.trim()) payload.notes = form.notes.trim()

    try {
      const url = isEdit ? `/api/dossiers/${dossierId}` : '/api/dossiers'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setServerError((data as { error?: string }).error ?? 'Une erreur est survenue.')
        return
      }

      const { dossier } = await res.json()
      router.push(`/dashboard/${dossier.id}`)
      router.refresh()
    } catch {
      setServerError('Impossible de contacter le serveur. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {/* Référence */}
        <div className="space-y-1.5">
          <Label htmlFor="reference">
            Référence interne <span className="text-red-500">*</span>
          </Label>
          <Input
            id="reference"
            placeholder="ex : 2026-VTE-042"
            value={form.reference}
            onChange={(e) => set('reference', e.target.value)}
            aria-invalid={!!errors.reference}
          />
          {errors.reference && (
            <p className="text-xs text-red-600">{errors.reference}</p>
          )}
        </div>

        {/* Type d'acte */}
        <div className="space-y-1.5">
          <Label htmlFor="type_acte">
            Type d'acte <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.type_acte || undefined}
            onValueChange={(v) => set('type_acte', v as TypeActe)}
          >
            <SelectTrigger id="type_acte" className="w-full h-8" aria-invalid={!!errors.type_acte}>
              <SelectValue placeholder="Sélectionner un type d'acte" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_ACTE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type_acte && (
            <p className="text-xs text-red-600">{errors.type_acte}</p>
          )}
        </div>

        {/* Date de signature */}
        <div className="space-y-1.5">
          <Label htmlFor="date_signature">
            Date de signature prévue <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date_signature"
            type="date"
            value={form.date_signature}
            onChange={(e) => set('date_signature', e.target.value)}
            aria-invalid={!!errors.date_signature}
          />
          {errors.date_signature && (
            <p className="text-xs text-red-600">{errors.date_signature}</p>
          )}
        </div>

        {/* Date de compromis (conditionnelle) */}
        {showCompromis ? (
          <div className="space-y-1.5">
            <Label htmlFor="date_compromis">Date du compromis</Label>
            <Input
              id="date_compromis"
              type="date"
              value={form.date_compromis}
              onChange={(e) => set('date_compromis', e.target.value)}
            />
          </div>
        ) : (
          <div /> /* placeholder pour garder le grid aligné */
        )}

        {/* Vendeur / Donateur / Défunt */}
        <div className="space-y-1.5">
          <Label htmlFor="vendeur_nom">{partyLabels.vendeur}</Label>
          <Input
            id="vendeur_nom"
            placeholder={`Nom du ${partyLabels.vendeur.toLowerCase()}`}
            value={form.vendeur_nom}
            onChange={(e) => set('vendeur_nom', e.target.value)}
          />
        </div>

        {/* Acquéreur / Donataire / Héritiers */}
        <div className="space-y-1.5">
          <Label htmlFor="acquereur_nom">{partyLabels.acquereur}</Label>
          <Input
            id="acquereur_nom"
            placeholder={`Nom de l'${partyLabels.acquereur.toLowerCase()}`}
            value={form.acquereur_nom}
            onChange={(e) => set('acquereur_nom', e.target.value)}
          />
        </div>

        {/* Adresse du bien — pleine largeur */}
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="adresse_bien">Adresse du bien</Label>
          <Input
            id="adresse_bien"
            placeholder="ex : 12 rue de la Paix, 75001 Paris"
            value={form.adresse_bien}
            onChange={(e) => set('adresse_bien', e.target.value)}
          />
        </div>

        {/* Prix / valeur */}
        <div className="space-y-1.5">
          <Label htmlFor="prix_vente">Prix / valeur estimée (€)</Label>
          <Input
            id="prix_vente"
            inputMode="decimal"
            placeholder="ex : 350000"
            value={form.prix_vente}
            onChange={(e) => set('prix_vente', e.target.value)}
          />
        </div>

        {/* Notes — pleine largeur */}
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="notes">Notes libres</Label>
          <Textarea
            id="notes"
            rows={4}
            placeholder="Observations, particularités du dossier…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>
      </div>

      {/* Erreur serveur */}
      {serverError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {serverError}
        </p>
      )}

      {/* Actions */}
      <div className="mt-8 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard')}
          disabled={submitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? isEdit ? 'Enregistrement…' : 'Création en cours…'
            : isEdit ? 'Enregistrer les modifications' : 'Créer le dossier'}
        </Button>
      </div>
    </form>
  )
}
