import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { buildEmailTemplate } from '@/lib/email/templates'
import type { Dossier, Rappel } from '@/types'

// GET /api/rappels/send-scheduled
// Sécurisé par Authorization: Bearer $CRON_SECRET
// Appelé par Vercel Cron (0 7 * * 1-5)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const to = process.env.NOTIFICATION_EMAIL_TO
  const from = process.env.RESEND_FROM_EMAIL ?? 'Dashboard Notaire <noreply@resend.dev>'

  if (!to) {
    return NextResponse.json({ error: 'NOTIFICATION_EMAIL_TO non configuré' }, { status: 500 })
  }

  // Utiliser le service role key pour bypasser RLS (contexte cron)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const today = new Date().toISOString().split('T')[0]

  const { data: rappels, error: fetchError } = await supabase
    .from('rappels')
    .select('*, dossiers(*)')
    .lte('date_rappel', today)
    .eq('envoye', false)
    .neq('statut', 'realise')

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!rappels || rappels.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  const errors: string[] = []

  for (const row of rappels) {
    const rappel = row as Rappel & { dossiers: Dossier }
    const dossier = rappel.dossiers
    if (!dossier) continue

    const { subject, html } = buildEmailTemplate(rappel, dossier)
    const { error: sendError } = await resend.emails.send({ from, to, subject, html })

    if (sendError) {
      errors.push(`${rappel.id}: ${sendError.message}`)
      continue
    }

    await supabase
      .from('rappels')
      .update({ envoye: true, date_envoi: new Date().toISOString() })
      .eq('id', rappel.id)

    sent++
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined })
}
