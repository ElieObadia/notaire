import type { Dossier, Rappel, TypeRappel } from '@/types'
import { formatDate } from '@/lib/dates'

interface EmailTemplate {
  subject: string
  html: string
}

const TYPE_RAPPEL_LABELS: Record<TypeRappel, string> = {
  purge_dpu_envoi_dia: 'Envoi DIA — Purge DPU',
  purge_dpu_fin_delai: 'Fin délai DPU (2 mois)',
  purge_safer: 'Purge SAFER',
  purge_droit_locataire: 'Purge droit locataire',
  retractation_sru_fin: 'Fin délai de rétractation SRU',
  reflexion_sru_fin: 'Fin délai de réflexion SRU',
  condition_suspensive_pret: 'Condition suspensive — Obtention prêt',
  acceptation_offre_pret: 'Acceptation offre de prêt',
  reflexion_vefa: 'Délai de réflexion VEFA',
  declaration_succession: 'Déclaration de succession',
  signature_imminente: 'Signature imminente (J-7)',
  rappel_signature: 'Rappel signature (J-1)',
  relance_pieces_manquantes: 'Relance — Pièces manquantes',
}

const TYPE_RAPPEL_CONSEILS: Record<TypeRappel, string> = {
  purge_dpu_envoi_dia: "Envoyez la Déclaration d'Intention d'Aliéner (DIA) en mairie. Le délai de 2 mois pour exercer le droit de préemption court à compter de la réception.",
  purge_dpu_fin_delai: "Le délai de 2 mois du DPU arrive à échéance. Vérifiez la décision de la mairie (renonciation ou exercice du droit de préemption).",
  purge_safer: "Le délai de purge SAFER approche. Vérifiez la décision de la SAFER concernant son droit de préemption.",
  purge_droit_locataire: "Le délai de purge du droit de préemption du locataire arrive à terme. Vérifiez la décision du locataire.",
  retractation_sru_fin: "Le délai légal de rétractation de 10 jours (art. L.271-1 CCH) prend fin. Vérifiez qu'aucune rétractation n'a été notifiée.",
  reflexion_sru_fin: "Le délai de réflexion prend fin. Recueillez la confirmation de l'acquéreur.",
  condition_suspensive_pret: "La condition suspensive d'obtention de prêt arrive à échéance. Vérifiez l'état du financement auprès de l'acquéreur.",
  acceptation_offre_pret: "Le délai de réflexion de 10 jours après réception de l'offre de prêt (art. L.313-34 CMF) prend fin. L'acceptation peut maintenant être effectuée.",
  reflexion_vefa: "Le délai de réflexion VEFA arrive à terme. Recueillez la confirmation du signataire.",
  declaration_succession: "La déclaration de succession doit être déposée dans les 6 mois (art. 641 CGI). Contactez les héritiers pour avancer les démarches fiscales.",
  signature_imminente: "La signature de l'acte est prévue dans 7 jours. Vérifiez que toutes les pièces sont reçues et que les parties sont confirmées.",
  rappel_signature: "La signature de l'acte est prévue demain. Confirmez la disponibilité de toutes les parties et la complétude du dossier.",
  relance_pieces_manquantes: "Des pièces justificatives sont peut-être encore manquantes. Relancez les parties pour finaliser le dossier avant la signature.",
}

function buildHtml(
  rappel: Rappel,
  dossier: Dossier,
  appUrl: string,
): string {
  const label = TYPE_RAPPEL_LABELS[rappel.type_rappel]
  const conseil = TYPE_RAPPEL_CONSEILS[rappel.type_rappel]
  const dossierUrl = `${appUrl}/dashboard/${dossier.id}`
  const dateRappel = formatDate(rappel.date_rappel)
  const dateSignature = formatDate(dossier.date_signature)
  const partyLine = [dossier.vendeur_nom, dossier.acquereur_nom].filter(Boolean).join(' → ')

  const message = rappel.message_personnalise
    ? `<p style="background:#fef9c3;border-left:3px solid #ca8a04;padding:12px 16px;border-radius:4px;margin:16px 0;font-size:14px;color:#713f12;">${rappel.message_personnalise}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${label}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

    <!-- En-tête -->
    <div style="background:#1e3a5f;padding:24px 32px;">
      <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Dashboard Notaire</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">${label}</h1>
    </div>

    <!-- Corps -->
    <div style="padding:28px 32px;">

      <!-- Dossier -->
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Dossier</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#1e3a5f;">${dossier.reference}</p>
        ${partyLine ? `<p style="margin:4px 0 0;font-size:13px;color:#475569;">${partyLine}</p>` : ''}
        ${dossier.adresse_bien ? `<p style="margin:2px 0 0;font-size:12px;color:#94a3b8;">${dossier.adresse_bien}</p>` : ''}
      </div>

      <!-- Dates -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px 12px;background:#fef2f2;border-radius:6px 0 0 6px;font-size:12px;color:#64748b;font-weight:500;white-space:nowrap;">Date du délai</td>
          <td style="padding:8px 12px;background:#fef2f2;border-radius:0 6px 6px 0;font-size:14px;font-weight:700;color:#dc2626;">${dateRappel}</td>
        </tr>
        <tr><td style="height:6px;" colspan="2"></td></tr>
        <tr>
          <td style="padding:8px 12px;background:#f1f5f9;border-radius:6px 0 0 6px;font-size:12px;color:#64748b;font-weight:500;white-space:nowrap;">Date de signature</td>
          <td style="padding:8px 12px;background:#f1f5f9;border-radius:0 6px 6px 0;font-size:14px;font-weight:600;color:#334155;">${dateSignature}</td>
        </tr>
      </table>

      ${message}

      <!-- Conseil -->
      <p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 24px;">${conseil}</p>

      <!-- CTA -->
      <a href="${dossierUrl}" style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
        Ouvrir le dossier →
      </a>
    </div>

    <!-- Pied de page -->
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
        Email généré automatiquement — Dashboard Notaire Immobilier<br/>
        <span style="color:#e2e8f0;">⚠︎ Ces informations sont indicatives. La collaboratrice reste seule responsable de la conformité juridique des dossiers.</span>
      </p>
    </div>

  </div>
</body>
</html>`
}

export function buildEmailTemplate(
  rappel: Rappel,
  dossier: Dossier,
  appUrl: string = process.env.NEXT_PUBLIC_APP_URL ?? '',
): EmailTemplate {
  const label = TYPE_RAPPEL_LABELS[rappel.type_rappel]
  const subject = `[${dossier.reference}] ${label} — ${formatDate(rappel.date_rappel)}`
  const html = buildHtml(rappel, dossier, appUrl)
  return { subject, html }
}
