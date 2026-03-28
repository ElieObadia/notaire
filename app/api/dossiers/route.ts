import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPiecesRequises } from '@/lib/pieces-requises';
import { getRappels } from '@/lib/rappels';
import type { TypeActe } from '@/types';

// GET /api/dossiers
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statut = searchParams.get('statut');
  const q = searchParams.get('q');

  let query = supabase
    .from('dossiers')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('date_signature', { ascending: true });

  if (statut) {
    query = query.eq('statut', statut);
  }

  if (q) {
    query = query.or(
      `reference.ilike.%${q}%,vendeur_nom.ilike.%${q}%,acquereur_nom.ilike.%${q}%,adresse_bien.ilike.%${q}%`
    );
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}

// POST /api/dossiers
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const {
    reference,
    type_acte,
    date_signature,
    date_compromis,
    vendeur_nom,
    acquereur_nom,
    adresse_bien,
    prix_vente,
    notes,
  } = body as Record<string, unknown>;

  if (!reference || !type_acte || !date_signature) {
    return NextResponse.json(
      { error: 'Champs obligatoires manquants : reference, type_acte, date_signature' },
      { status: 400 }
    );
  }

  // 1. Insérer le dossier
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .insert({
      reference,
      type_acte,
      date_signature,
      date_compromis: date_compromis ?? null,
      vendeur_nom: vendeur_nom ?? null,
      acquereur_nom: acquereur_nom ?? null,
      adresse_bien: adresse_bien ?? null,
      prix_vente: prix_vente ?? null,
      notes: notes ?? null,
      user_id: user.id,
    })
    .select()
    .single();

  if (dossierError || !dossier) {
    return NextResponse.json({ error: dossierError?.message ?? 'Erreur création dossier' }, { status: 500 });
  }

  // 2. Générer et insérer les pièces requises
  const piecesRequises = getPiecesRequises(type_acte as TypeActe);
  const piecesInsert = piecesRequises.map((p) => ({
    dossier_id: dossier.id,
    nom: p.nom,
    categorie: p.categorie,
    obligatoire: p.obligatoire,
    validite_mois: p.validite_mois ?? null,
  }));

  const { data: pieces, error: piecesError } = await supabase
    .from('pieces_dossier')
    .insert(piecesInsert)
    .select();

  if (piecesError) {
    return NextResponse.json({ error: piecesError.message }, { status: 500 });
  }

  // 3. Générer et insérer les rappels calculables
  const rappelsCalcules = getRappels(dossier);
  const { data: rappels, error: rappelsError } = await supabase
    .from('rappels')
    .insert(rappelsCalcules)
    .select();

  if (rappelsError) {
    return NextResponse.json({ error: rappelsError.message }, { status: 500 });
  }

  return NextResponse.json({ dossier, pieces: pieces ?? [], rappels: rappels ?? [] }, { status: 201 });
}
