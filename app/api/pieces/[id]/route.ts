import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// PATCH /api/pieces/[id]
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

  // Seuls ces champs sont autorisés
  const allowed: Record<string, unknown> = {};
  if ('recu' in body) allowed.recu = body.recu;
  if ('date_reception' in body) allowed.date_reception = body.date_reception;
  if ('commentaire' in body) allowed.commentaire = body.commentaire;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Aucun champ valide fourni' }, { status: 400 });
  }

  // La RLS garantit que seul le propriétaire du dossier parent peut modifier la pièce
  const { data: piece, error } = await supabase
    .from('pieces_dossier')
    .update(allowed)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !piece) {
    return NextResponse.json({ error: error?.message ?? 'Pièce introuvable' }, { status: error ? 500 : 404 });
  }

  return NextResponse.json({ piece });
}
