import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// PATCH /api/rappels/[id]  — marquer un rappel comme réalisé
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

  const allowed: Record<string, unknown> = {};
  if ('statut' in body) allowed.statut = body.statut;
  if ('message_personnalise' in body) allowed.message_personnalise = body.message_personnalise;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Aucun champ valide fourni' }, { status: 400 });
  }

  // La RLS vérifie l'ownership via le dossier parent
  const { data: rappel, error } = await supabase
    .from('rappels')
    .update(allowed)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !rappel) {
    return NextResponse.json({ error: error?.message ?? 'Rappel introuvable' }, { status: error ? 500 : 404 });
  }

  return NextResponse.json({ rappel });
}
