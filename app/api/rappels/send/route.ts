import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { buildEmailTemplate } from '@/lib/email/templates'
import type { Dossier, Rappel } from '@/types'

// POST /api/rappels/send
// Body: { rappel_id: string }
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: { rappel_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { rappel_id } = body
  if (!rappel_id || typeof rappel_id !== 'string') {
    return NextResponse.json({ error: 'rappel_id requis' }, { status: 400 })
  }

  // Récupérer le rappel avec vérification ownership via RLS
  const { data: rappelData, error: rappelError } = await supabase
    .from('rappels')
    .select('*, dossiers(*)')
    .eq('id', rappel_id)
    .single()

  if (rappelError || !rappelData) {
    return NextResponse.json({ error: 'Rappel introuvable' }, { status: 404 })
  }

  const rappel = rappelData as Rappel & { dossiers: Dossier }
  const dossier = rappel.dossiers

  if (!dossier) {
    return NextResponse.json({ error: 'Dossier associé introuvable' }, { status: 404 })
  }

  const to = process.env.NOTIFICATION_EMAIL_TO
  const from = process.env.RESEND_FROM_EMAIL ?? 'Dashboard Notaire <noreply@resend.dev>'

  if (!to) {
    return NextResponse.json({ error: 'NOTIFICATION_EMAIL_TO non configuré' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { subject, html } = buildEmailTemplate(rappel, dossier)

  const { error: sendError } = await resend.emails.send({ from, to, subject, html })
  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 502 })
  }

  // Marquer comme envoyé
  const { data: updated, error: updateError } = await supabase
    .from('rappels')
    .update({ envoye: true, date_envoi: new Date().toISOString() })
    .eq('id', rappel_id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ rappel: updated })
}
