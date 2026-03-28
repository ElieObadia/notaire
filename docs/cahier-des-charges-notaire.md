# Cahier des Charges Fonctionnel
## Dashboard de suivi de dossiers — Collaboratrice Notaire · Branche Immobilier

**Version :** 1.0  
**Date :** Mars 2026  
**Destinataire :** Collaboratrice notaire, usage interne, accès unique  

---

## 1. Contexte et objectifs

### 1.1 Contexte

L'outil est destiné à une collaboratrice notaire exerçant dans la branche immobilière d'un office notarial en France. Elle gère quotidiennement un portefeuille de dossiers (ventes, prêts, donations, successions…) et doit suivre simultanément des dizaines d'échéances légales, de pièces justificatives à collecter, et de rappels à envoyer aux clients.

### 1.2 Problème à résoudre

- Risque d'oubli sur les délais légaux impératifs (purge DPU, rétractation SRU, offre de prêt…)
- Pas de vision consolidée de l'avancement des dossiers
- Suivi des pièces manquantes fait manuellement
- Charge mentale élevée sur la gestion des rappels clients

### 1.3 Objectifs de l'application

1. **Centraliser** tous les dossiers actifs en un seul endroit
2. **Générer automatiquement** la checklist de pièces selon le type d'acte
3. **Calculer automatiquement** les dates de rappel légaux et contractuels
4. **Alerter** sur les échéances imminentes
5. **Mémoriser** l'historique et l'avancement de chaque dossier

---

## 2. Périmètre fonctionnel

### 2.1 Actes couverts

L'application couvre l'intégralité des actes courants du notariat immobilier français :

| Code acte | Libellé complet | Fréquence terrain |
|---|---|---|
| `compromis_vente` | Compromis de vente | Très fréquent |
| `promesse_vente` | Promesse unilatérale de vente | Fréquent |
| `vente_simple` | Acte authentique de vente (ancien) | Très fréquent |
| `vefa` | Vente en l'État Futur d'Achèvement | Fréquent |
| `vente_viager` | Vente en viager (libre ou occupé) | Occasionnel |
| `donation_immobiliere` | Donation simple d'un bien immeuble | Fréquent |
| `donation_partage` | Donation-partage entre héritiers | Occasionnel |
| `succession_immo` | Règlement de succession avec bien immobilier | Fréquent |
| `pret_hypothecaire` | Acte de prêt immobilier avec hypothèque | Très fréquent |
| `mainlevee` | Mainlevée d'hypothèque | Occasionnel |
| `bail_emphyteotique` | Bail emphytéotique | Rare |
| `servitude` | Acte constitutif de servitude | Occasionnel |
| `etat_descriptif` | État descriptif de division (copropriété) | Occasionnel |
| `reglement_copropriete` | Règlement de copropriété | Rare |

---

## 3. Délais légaux à surveiller par type d'acte

> ⚠️ Ces délais sont d'ordre public et leur non-respect peut engager la responsabilité du notaire.

### 3.1 Tableau général des délais

| Délai | Durée | Déclencheur | Actes concernés | Base légale |
|---|---|---|---|---|
| **Rétractation SRU** | 10 jours calendaires | Lendemain 1ère présentation LRAR | Compromis, promesse | Art. L271-1 CCH |
| **Réflexion SRU** (sans avant-contrat) | 10 jours calendaires | Lendemain remise projet d'acte | Acte authentique direct | Art. L271-1 CCH |
| **Purge DPU** (Droit de Préemption Urbain) | 2 mois | Réception DIA par la mairie | Compromis → vente | Art. L211-2 CU |
| **Purge DPU renforcée** | 2 mois + 1 mois possible | Demande pièces complémentaires | Compromis → vente | Art. L213-2 CU |
| **Purge SAFER** (terrain agricole) | 2 mois | Réception DIA par SAFER | Vente terrain agricole | Art. L143-1 C. rural |
| **Purge droit locataire** | 2 mois | Notification congé pour vendre | Vente bien loué | Loi 89-462 du 6/07/89 |
| **Condition suspensive prêt** | Min. 1 mois légal, 45 j en pratique | Date signature compromis | Compromis avec financement | Art. L313-41 C. conso |
| **Acceptation offre de prêt** | 10 jours minimum d'attente | Réception offre bancaire | Acte de prêt | Art. L313-34 CMF |
| **Délai réflexion VEFA** | 1 mois | Réception LRAR contrat de vente | VEFA | Art. R261-30 CCH |
| **Déclaration de succession** | 6 mois (12 mois si décès hors France) | Date du décès | Succession | Art. 641 CGI |
| **Attestation immobilière succession** | 4 mois | Date de réquisition | Succession avec immeuble | Décret 55-22 art. 33 |
| **Acte de partage** | 10 mois du décès (pour dispense d'attestation) | Date du décès | Succession | Décret 55-22 art. 29 |
| **Publicité foncière post-vente** | Pas de délai impératif mais usage : 1-3 mois | Date signature acte | Tous actes translatifs | Art. 28 D. 55-22 |
| **Nullité pour défaut DIA** | Prescription 5 ans | Date publication acte | Si DPU non purgé | Art. L213-2 al. dernier CU |

### 3.2 Délais de rappel recommandés (paramétrés dans l'app)

| Rappel | Déclenchement automatique |
|---|---|
| Pièces manquantes critiques | J-30, J-14, J-7 avant signature |
| Signature imminente | J-7 avant date signature |
| Veille de signature | J-1 avant date signature |
| Purge DPU à envoyer | Dès signature compromis |
| Fin délai DPU | J+55 après envoi DIA (alerte à J+50) |
| Offre de prêt expirante | J-7 avant fin délai condition suspensive |
| Déclaration succession | J+150 après décès (alerte, délai légal 6 mois) |

---

## 4. Pièces justificatives par type d'acte

### 4.1 Pièces communes à tous les dossiers

#### Identité des parties (vendeur, donateur, acquéreur, héritier…)
- Carte nationale d'identité ou passeport en cours de validité
- Livret de famille complet
- Contrat de mariage ou convention de PACS + récépissé d'enregistrement
- Jugement de divorce ou séparation de corps (si applicable)
- Justificatif de domicile < 3 mois
- RIB original

#### Si personne morale (SCI, société…)
- Statuts à jour
- Extrait Kbis < 3 mois
- Délibération d'AG autorisant l'acte
- Pièce d'identité du représentant légal

---

### 4.2 COMPROMIS DE VENTE / PROMESSE DE VENTE

#### Du vendeur
- Titre de propriété (acte authentique d'acquisition)
- Taxe foncière dernière année
- Avis de taxe d'habitation (si applicable)
- Tableau d'amortissement du prêt en cours + coordonnées de la banque (si bien hypothéqué)

#### Du bien — Diagnostics techniques obligatoires (DDT)
| Diagnostic | Validité | Condition d'application |
|---|---|---|
| DPE (Diagnostic de Performance Énergétique) | 10 ans | Tous biens |
| CREP — Plomb | 1 an si positif, illimité si négatif | Immeuble avant 01/01/1948 |
| Amiante parties privatives | Illimité si négatif | Immeuble avant 01/07/1997 |
| État parasitaire (termites) | 6 mois | Zone arrêtée préfectorale |
| État des Risques et Pollutions (ERP) | 6 mois | Tous biens |
| Diagnostic électricité | 3 ans | Installation > 15 ans |
| Diagnostic gaz | 3 ans | Installation > 15 ans |
| Audit énergétique | 5 ans | Biens classés F ou G |
| SPANC (assainissement non collectif) | 3 ans | Bien sans tout-à-l'égout |
| Mesurage loi Carrez | Illimité si pas de travaux | Lot de copropriété |

#### Si bien en copropriété (loi ALUR)
- Fiche synthétique de la copropriété
- Règlement de copropriété + modificatifs publiés
- État descriptif de division
- 3 derniers procès-verbaux d'assemblée générale
- Dernier appel de charges + décompte annuel
- Budget prévisionnel des 2 dernières années
- Montant des charges impayées (pré-état daté)
- État daté (syndic) — obligatoire avant l'acte authentique
- Carnet d'entretien de l'immeuble
- Diagnostics parties communes (amiante, DPE collectif…)
- Coordonnées du syndic

#### Si maison individuelle
- Permis de construire + déclaration d'achèvement de travaux
- Certificat de conformité (ou non-opposition)
- Garantie décennale + attestation assurance dommages-ouvrage (si < 10 ans)

#### Si bien loué
- Copie du bail en cours
- Dernière quittance de loyer
- Lettre de congé pour vendre + AR (si applicable)
- État des lieux d'entrée

#### Documents urbanistiques
- Certificat d'urbanisme (CU opérationnel ou informatif)
- État hypothécaire (obtenu par le notaire)

#### De l'acquéreur
- Mode de financement : apport personnel, donation, prêt (coordonnées banque, montant, taux)
- Accord de principe bancaire ou attestation de financement (si prêt)

---

### 4.3 ACTE AUTHENTIQUE DE VENTE (en plus du compromis)

- Offre de prêt acceptée (après délai de 10 jours légal)
- Attestation assurance emprunteur
- État daté du syndic (< 1 mois)
- Relevés compteurs eau, gaz, électricité
- Copie factures équipements sous garantie
- Clés du logement (remises le jour de l'acte)

---

### 4.4 VEFA (Vente en l'État Futur d'Achèvement)

#### Du promoteur (déposant le dossier programme)
- Permis de construire + pièces annexées
- Attestation d'assurance dommages-ouvrage (DO)
- Garantie Financière d'Achèvement (GFA) ou garantie intrinsèque
- Plan de masse de l'opération
- Plan côté de chaque lot vendu
- Notice descriptive définitive (matériaux, équipements)
- État descriptif de division par géomètre-expert
- Règlement de copropriété (en cours d'établissement)
- Attestation RT 2012 / RE 2020 selon date de permis

#### De l'acquéreur
- Contrat de réservation signé
- Offre de prêt acceptée (ou attestation de financement)
- Assurance emprunteur

---

### 4.5 DONATION IMMOBILIÈRE / DONATION-PARTAGE

#### Du donateur
- Titre de propriété du bien donné
- Justificatifs d'identité + situation familiale complets
- État hypothécaire du bien
- Diagnostics techniques (selon nature du bien)
- Expertise de valeur du bien (rapport d'évaluation)

#### Du donataire
- Justificatifs d'identité
- Acte de naissance < 3 mois
- Justificatif du lien de parenté avec le donateur

#### Spécifique donation-partage
- Accord de tous les héritiers (donataires)
- Si soulte : justificatifs de paiement ou acte de prêt

---

### 4.6 SUCCESSION AVEC BIEN IMMOBILIER

#### Actes d'état civil
- Acte de décès du défunt
- Acte de naissance du défunt
- Livret de famille du défunt (toutes les pages)
- Actes de naissance de chaque héritier
- Contrat de mariage ou PACS du défunt
- Jugement de divorce (si applicable)

#### Dispositions de dernières volontés
- Testament olographe ou authentique (si trouvé)
- Résultat interrogation FCDDV (Fichier Central des Dispositions de Dernières Volontés) — fait par le notaire
- Donation-partage antérieure (si existante)

#### Patrimoine immobilier
- Titres de propriété de chaque bien immobilier
- Taxe foncière dernière année pour chaque bien
- Diagnostics techniques (si vente envisagée)
- État hypothécaire de chaque bien
- Évaluation/expertise de chaque bien

#### Patrimoine financier et dettes
- Relevés de tous les comptes bancaires au jour du décès
- Placements financiers (assurance-vie, PEA, livrets…)
- Dettes en cours (prêts, crédits à la consommation)
- Factures de frais funéraires

#### Fiscalité
- Déclaration de revenus du défunt (dernière année)
- Formulaire 2705 (déclaration de succession) — préparé par le notaire
- Justificatif d'éventuelle exonération (conjoint survivant…)

---

### 4.7 ACTE DE PRÊT HYPOTHÉCAIRE

#### De l'emprunteur
- Offre de prêt de la banque (après respect du délai de 10 jours légal)
- Tableau d'amortissement
- Fiche d'Information Standardisée Européenne (FISE)
- Attestation assurance emprunteur (décès, invalidité, chômage selon contrat)
- Titre de propriété du bien hypothéqué (si bien existant)
- État hypothécaire du bien à hypothéquer

#### De la banque
- Délégation de pouvoir du signataire bancaire
- Conditions générales et particulières du prêt

---

### 4.8 VENTE EN VIAGER

- Rapport d'expertise pour calcul de la valeur vénale du bien
- Tableau de calcul de la rente viagère (valeur occupée si viager occupé)
- Certificat médical récent du crédirentier (< 3 mois) — pour justifier l'espérance de vie
- Attestation d'assurance décès (couvrant le bouquet)
- Titre de propriété du bien
- Diagnostics techniques complets

---

### 4.9 MAINLEVÉE D'HYPOTHÈQUE

- Acte de prêt d'origine
- Attestation de remboursement total du prêt (solde zéro) délivrée par la banque
- État hypothécaire du bien
- Accord de mainlevée de la banque (délégation de pouvoir)

---

### 4.10 BAIL EMPHYTÉOTIQUE

- Titre de propriété du bien
- Bail emphytéotique en vigueur (si renouvellement)
- Délibération autorisant le bail (si personne morale)
- Attestation d'affectation du bien
- Plan et descriptif du bien

---

## 5. Fonctionnalités de l'application

### 5.1 Gestion des dossiers

**Création d'un dossier :**
L'utilisateur renseigne :
- Référence interne (ex : 2026-VTE-042)
- Type d'acte (liste déroulante)
- Date de signature prévue
- Parties (noms vendeur/donateur/défunt + acquéreur/donataire/héritiers)
- Adresse du bien
- Prix ou valeur estimée
- Notes libres

**À la validation**, l'application :
1. Génère automatiquement la checklist de pièces selon le type d'acte
2. Calcule et affiche toutes les dates de rappel légaux
3. Crée les rappels dans le calendrier interne

---

### 5.2 Checklist des pièces

Chaque pièce est affichée avec :
- Nom de la pièce
- Catégorie (vendeur / acquéreur / bien / financement / admin / succession)
- Caractère obligatoire ou optionnel
- Case à cocher "Reçue" avec date de réception
- Champ commentaire
- Validité restante (pour les diagnostics avec durée de vie)

**Vue d'avancement :** barre de progression (nombre de pièces reçues / total)

**Filtres disponibles :**
- Pièces manquantes uniquement
- Par catégorie
- Urgentes (délai < 15 jours ou liées à date clé)

---

### 5.3 Suivi des délais et rappels

**Tableau de bord des délais** sur chaque dossier :

| Délai | Date calculée | Statut | Action |
|---|---|---|---|
| Envoi DIA mairie | JJ/MM/AAAA | ⏳ À faire | Marquer envoyée |
| Fin délai DPU | JJ/MM/AAAA | ✅ Purgé | — |
| Fin délai rétractation SRU | JJ/MM/AAAA | ⚠️ Dans 3 jours | Alerte |
| Date limite condition suspensive prêt | JJ/MM/AAAA | ⏳ En cours | — |
| Acceptation offre de prêt (J+10) | JJ/MM/AAAA | ⏳ En cours | — |
| Signature | JJ/MM/AAAA | ⏳ Planifiée | — |

**Statuts possibles pour chaque délai :**
- `À faire` — action requise de la collaboratrice
- `En cours` — dans les délais
- `Alerte` — < 7 jours
- `Critique` — < 2 jours
- `Purgé / Réalisé` — terminé
- `Dépassé` — hors délai (alerte rouge)

---

### 5.4 Tableau de bord principal

**Vue globale des dossiers actifs :**
- Liste triable par : date de signature, statut, type d'acte, référence
- Couleur selon urgence (vert / orange / rouge)
- Nombre de pièces manquantes par dossier
- Prochain délai critique

**Widget "Alertes du jour" :**
Liste des actions urgentes du jour et des 7 prochains jours.

**Calendrier mensuel :**
Vue des signatures planifiées et des délais légaux importants.

---

### 5.5 Notifications et rappels

**Rappels automatiques par email (Resend) :**
- Configurable par dossier : activer/désactiver
- Modèles de messages pré-remplis (personnalisables)
- Historique des rappels envoyés (date, destinataire, type)

**Rappels dans l'interface :**
- Badge de notification sur l'icône du tableau de bord
- Pop-up à la connexion si alertes critiques

---

### 5.6 Authentification

- **Un seul compte utilisateur** créé manuellement (email + mot de passe)
- Connexion sécurisée via Supabase Auth
- Redirection automatique vers le dashboard si session active
- Session persistante (pas de reconnexion à chaque visite)
- Pas d'inscription publique

---

## 6. Règles métier importantes

### 6.1 Calcul du délai de rétractation SRU

- Durée : **10 jours calendaires**
- Départ : le lendemain de la **1ère présentation** de la LRAR
- Si le 10ème jour tombe un samedi, dimanche ou jour férié : report au 1er jour ouvrable suivant
- S'applique à tout acquéreur non-professionnel
- Ne peut pas être contractuellement réduit (d'ordre public)

### 6.2 Purge du DPU

- Le notaire envoie la DIA à la mairie après signature du compromis
- Délai de réponse : **2 mois** à compter de la réception de la DIA
- Silence au-delà de 2 mois = renonciation tacite
- Délai peut être prolongé de **1 mois** si la mairie demande des pièces complémentaires
- Omission de la DIA : nullité de la vente pendant **5 ans** après publication

### 6.3 Condition suspensive d'obtention de prêt

- Durée légale minimale : **1 mois** (art. L313-41 Code de la consommation)
- Durée pratique : **45 jours** dans la grande majorité des compromis
- Si refus de prêt dans le délai : avant-contrat caduc, dépôt de garantie restitué
- L'acquéreur doit justifier ses démarches bancaires

### 6.4 Offre de prêt

- Délai d'attente obligatoire avant acceptation : **10 jours** (art. L313-34 CMF)
- L'acte de prêt ne peut pas être signé avant l'expiration de ce délai
- L'offre a une durée de validité : généralement **30 jours** à compter de la réception

### 6.5 Déclaration de succession

- Délai légal : **6 mois** à compter du décès
- **12 mois** si le défunt est décédé hors de France
- Pénalités dès le 7ème mois : intérêts de 0,20% par mois
- Majoration de 10% à partir du 13ème mois

### 6.6 VEFA — Délai de réflexion

- Le notaire envoie le projet de contrat de vente à l'acquéreur en LRAR
- Délai de réflexion : **1 mois** minimum à compter de la réception
- L'acquéreur peut renoncer à ce délai expressément

---

## 7. Architecture technique recommandée

### Stack
- **Frontend + API Routes** : Next.js 14 (App Router), TypeScript strict
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth (1 compte unique)
- **Hébergement** : Vercel
- **Emails** : Resend
- **UI** : shadcn/ui + Tailwind CSS

### Sécurité
- Row Level Security (RLS) activé sur toutes les tables Supabase
- Variables d'environnement pour toutes les clés API
- Pas de service_role key exposée côté client

### Performance
- Server Components par défaut
- `"use client"` uniquement pour les interactions (checkboxes, formulaires)

---

## 8. Roadmap de développement

### Phase 1 — MVP (4-6 semaines)
- [x] Auth : login / logout page unique
- [x] Dashboard : liste des dossiers + statuts
- [x] Création de dossier avec type d'acte
- [x] Génération automatique checklist pièces
- [x] Cochage des pièces reçues
- [x] Calcul et affichage des délais légaux

### Phase 2 — Alertes (2-3 semaines)
- [ ] Envoi d'email de rappel (Resend + Vercel Cron)
- [ ] Historique des rappels envoyés
- [ ] Notifications in-app à la connexion

### Phase 3 — Ergonomie (2-3 semaines)
- [ ] Calendrier des signatures
- [ ] Recherche et filtres avancés
- [ ] Export PDF de la checklist d'un dossier
- [ ] Commentaires par pièce

### Phase 4 — Évolutions futures
- [ ] Archivage automatique des dossiers signés
- [ ] Statistiques (nombre de dossiers, délais moyens…)
- [ ] Mode sombre

---

## 9. Avertissement légal

> Ce cahier des charges est un document fonctionnel destiné à cadrer le développement d'un outil de suivi interne. Les informations sur les délais et les pièces requises sont indicatives et basées sur le droit en vigueur en mars 2026. La collaboratrice notaire reste seule responsable de la conformité juridique des dossiers qu'elle traite. L'application ne dispense pas du contrôle professionnel et ne saurait constituer un conseil juridique.

---

*Document généré pour usage interne · Office notarial · Branche immobilière*
