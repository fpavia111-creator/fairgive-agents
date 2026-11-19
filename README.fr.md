# Agents Fairgive pour les organismes sans but lucratif

*Traduit par Claude ; relecture par un locuteur natif en attente. Le [README](README.md) anglais fait foi.*

Trente-deux petits agents MCP pour le back-office des associations, fondations, Églises et organismes sans but lucratif. Chacun a **une seule tâche**, par exemple les dons face aux remises en banque, les libérations de restrictions, les appels de fonds des subventions ou les relevés annuels de dons, et ne peut agir au-delà. Ils lisent les fichiers que vous exportez déjà de votre CRM de dons, de vos prestataires de paiement et de votre comptabilité, écrivent leurs rapports sur votre ordinateur et attendent une personne nommée avant de déplacer de l’argent, d’envoyer un message, de déposer quoi que ce soit auprès d’une administration ou d’un financeur, ou de modifier un système en production.

Fait partie de Fair Agents de Mythos Machines. Licence MIT · Node 20 ou plus récent · fichiers locaux uniquement · aucun identifiant · aucune dépendance. Le logiciel est gratuit ; la partie payante est une mise en place à prix fixe sur vos propres fichiers.

## Essayer

```bash
npx -y fairgive-gift-deposits demo     # dons face aux remises et au grand livre, données fictives
npx -y fairgive-grant-budgets demo     # budget des subventions face au réalisé
```

Chaque agent a une `demo` sur des fichiers fictifs, un `eval` avec ses propres cas de test et un serveur MCP (`npx -y <agent> mcp --root <dossier>`).

## Les agents

**Dons et donateurs (10):** `fairgive-gift-deposits` (dons du CRM face aux remises en banque et au grand livre), `fairgive-acknowledgements` (remerciements manquants, tardifs ou erronés), `fairgive-duplicate-donors` (fiches donateurs en double), `fairgive-recurring-gifts` (dons réguliers échoués, cartes qui expirent), `fairgive-lapsed-donors` (LYBUNT, SYBUNT et fidélisation), `fairgive-gift-coding` (dons codés contre l’intention du donateur), `fairgive-matching-gifts` (abondements non demandés, échéances), `fairgive-daf-grants` (dons de fonds orientés à examiner), `fairgive-refunds-chargebacks` (remboursements et litiges face aux dons du CRM), `fairgive-processor-fees` (frais et virements Stripe, PayPal, Givebutter, Classy).

**Événements, contreparties, membres et bénévoles (6):** `fairgive-quid-pro-quo` (mentions des contreparties et montants déductibles), `fairgive-event-revenue` (billets ventilés entre contrepartie et don), `fairgive-in-kind-gifts` (dons en nature : valeurs, expertises, services), `fairgive-memberships` (cotisations, renouvellements, adhérents perdus), `fairgive-giving-statements` (relevés annuels de dons pour Églises et associations), `fairgive-volunteer-hours` (heures de bénévolat, valeur, vérifications).

**Subventions (6):** `fairgive-grant-budgets` (budget des subventions face au réalisé, coûts partagés), `fairgive-indirect-costs` (base des coûts indirects (MTDC) et taux), `fairgive-grant-reports` (calendrier des rapports et retards), `fairgive-grant-drawdowns` (montants à appeler, coûts anciens, excédents), `fairgive-single-audit` (dépenses fédérales face au seuil d’audit unique), `fairgive-payroll-allocation` (charges salariales face aux temps déclarés).

**Fonds, actifs nets et trésorerie (6):** `fairgive-fund-balances` (soldes des fonds par restriction), `fairgive-restriction-releases` (libérations de restrictions et écriture), `fairgive-board-designated` (fonds affectés par le conseil face aux résolutions), `fairgive-endowment-draw` (prélèvement sur la dotation selon la politique), `fairgive-liquidity` (actifs financiers disponibles sous un an), `fairgive-pledges` (promesses à recevoir, ancienneté, abandons).

**Dépenses, paie et clôture (4):** `fairgive-functional-expenses` (répartition programmes, gestion, collecte), `fairgive-expense-reports` (notes de frais face à votre politique), `fairgive-vendor-1099` (préparation des 1099, W-9 et identifiants fiscaux), `fairgive-form-990-data` (données des annexes du formulaire 990 (sans dépôt)).

## Comment ils restent sûrs

- **Une tâche chacun.** Chaque agent a sa propre liste d’outils ; tout autre nom d’outil est bloqué.
- **Rien d’engageant ne se fait tout seul.** Aucun agent ne paie, ne rembourse, ne débite une carte, ne passe d’écriture, ne modifie le CRM, ne dépose de formulaire ni n’envoie de lettre. Ces actions sont refusées ou attendent le clic d’une personne nommée, même en mode Auto.
- **Les données personnelles sont masquées.** Noms, e-mails, téléphones, adresses et identifiants fiscaux sont remplacés par des jetons dans tout ce qui est renvoyé au modèle d’IA. Les fichiers écrits sur votre ordinateur gardent les vraies valeurs. Le texte libre (notes, libellés bancaires) est envoyé tel quel : un nom tapé là n’est masqué que s’il figure aussi dans une colonne masquée.
- **Fichiers locaux uniquement.** Aucun appel réseau, aucune télémétrie, aucun identifiant. Chaque appel est inscrit dans un journal d’audit chaîné sous `.fairgive/`.
- **Vos règles.** Seuils, taux, dates et politiques sont des paramètres dans votre propre fichier ; le résultat indique toujours ceux qui ont été utilisés.

## Développer

```bash
npm install
npm test                      # core and 32 agents
npm run evals
npm run hostile
npm run hostile:args
npm run bench
npm run intl
npm run masking
npm run release:check:offline
```

## Comment ils sont testés

Chaque contrôle et ses chiffres figurent dans [REVIEW-ver1.md](REVIEW-ver1.md) (en anglais).

## Limites

- Les formats de colonnes des exports nommés ont été écrits à partir de la connaissance des systèmes et non vérifiés sur un compte réel.
- Seuils et règles (IRS, règles fédérales des subventions, droit des fonds de dotation, conditions des financeurs) changent ; ce sont des paramètres que votre comptable, auditeur ou avocat confirme.
- Pas de conseil juridique, fiscal, d’audit ou comptable. Rien n’est déposé, aucun argent n’est déplacé.
- Les traductions de ces README et des pages de rapport ont été rédigées par Claude et n’ont pas été relues par des locuteurs natifs.

## Licence

MIT © 2026 Kurt Francisco
