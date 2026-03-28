import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRappels } from '@/lib/rappels';
import type { Dossier } from '@/types';

type RouteContext = { params: { id: string } };

// GET /api/dossiers/[id]
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (dossierError || !dossier) {
    return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
  }

  const [{ data: pieces }, { data: rappels }] = await Promise.all([
    supabase.from('pieces_dossier').select('*').eq('dossier_id', params.id),
    supabase.from('rappels').select('*').eq('dossier_id', params.id).order('date_rappel', { ascending: true }),
  ]);

  return NextResponse.json({ dossier, pieces: pieces ?? [], rappels: rappels ?? [] });
}

// PATCH /api/dossiers/[id]
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  // Vérifier que le dossier appartient à l'utilisateur
  const { data: existing, error: fetchError } = await supabase
    .from('dossiers')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
  }

  const { data: dossier, error: updateError } = await supabase
    .from('dossiers')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (updateError || !dossier) {
    return NextResponse.json({ error: updateError?.message ?? 'Erreur mise à jour' }, { status: 500 });
  }

  // Recalculer les rappels si date_signature ou date_compromis a changé
  const dateChanged =
    ('date_signature' in body && body.date_signature !== existing.date_signature) ||
    ('date_compromis' in body && body.date_compromis !== existing.date_compromis);

  if (dateChanged) {
    // Supprimer les rappels non envoyés
    await supabase
      .from('rappels')
      .delete()
      .eq('dossier_id', params.id)
      .eq('envoye', false);

    // Recalculer et réinsérer
    const rappelsCalcules = getRappels(dossier as Dossier);
    await supabase.from('rappels').insert(rappelsCalcules);
  }

  return NextResponse.json({ dossier });
}

// DELETE /api/dossiers/[id]
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { error } = await supabase
    .from('dossiers')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
