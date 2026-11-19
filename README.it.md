# Agenti Fairgive per enti non profit

*Tradotto da Claude; revisione da parte di un madrelingua in attesa. Fa fede il [README](README.md) in inglese.*

Trentadue piccoli agenti MCP per il back office di enti non profit, fondazioni, chiese e associazioni. Ognuno ha **un solo compito**, come le donazioni rispetto ai versamenti in banca, gli svincoli dai vincoli, le richieste di erogazione o i riepiloghi annuali delle offerte, e non può agire oltre. Leggono i file che già esportate dal CRM dei donatori, dai gateway di pagamento e dalla contabilità, scrivono i report sul vostro computer e aspettano una persona indicata per nome prima di spostare denaro, inviare un messaggio, presentare qualcosa a un ente pubblico o a un finanziatore, o modificare un sistema in produzione.

Parte di Fair Agents di Mythos Machines. Licenza MIT · Node 20 o successivo · solo file locali · nessuna credenziale · nessuna dipendenza. Il software è gratuito; si paga un’installazione a prezzo fisso sui vostri file.

## Provatene uno

```bash
npx -y fairgive-gift-deposits demo     # donazioni rispetto a versamenti e contabilità, dati fittizi
npx -y fairgive-grant-budgets demo     # budget dei contributi rispetto al consuntivo
```

Ogni agente ha una `demo` su file fittizi, un `eval` con i propri casi di prova e un server MCP (`npx -y <agente> mcp --root <cartella>`).

## Gli agenti

**Donazioni e donatori (10):** `fairgive-gift-deposits` (donazioni del CRM rispetto a versamenti e contabilità), `fairgive-acknowledgements` (ringraziamenti mancanti, tardivi o errati), `fairgive-duplicate-donors` (anagrafiche donatori duplicate), `fairgive-recurring-gifts` (donazioni ricorrenti fallite, carte in scadenza), `fairgive-lapsed-donors` (LYBUNT, SYBUNT e fidelizzazione), `fairgive-gift-coding` (donazioni codificate contro la volontà del donatore), `fairgive-matching-gifts` (raddoppi aziendali non richiesti, scadenze), `fairgive-daf-grants` (erogazioni da DAF da verificare), `fairgive-refunds-chargebacks` (rimborsi e contestazioni rispetto alle donazioni del CRM), `fairgive-processor-fees` (commissioni e accrediti di Stripe, PayPal, Givebutter, Classy).

**Eventi, controprestazioni, soci e volontari (6):** `fairgive-quid-pro-quo` (avvisi di controprestazione e importi deducibili), `fairgive-event-revenue` (biglietti ripartiti tra controprestazione e donazione), `fairgive-in-kind-gifts` (donazioni in natura: valori, perizie, servizi), `fairgive-memberships` (quote, rinnovi e soci decaduti), `fairgive-giving-statements` (riepiloghi annuali per chiese ed enti), `fairgive-volunteer-hours` (ore di volontariato, valore e verifiche).

**Contributi (6):** `fairgive-grant-budgets` (budget rispetto al consuntivo, costi condivisi), `fairgive-indirect-costs` (base dei costi indiretti (MTDC) e aliquote), `fairgive-grant-reports` (calendario delle rendicontazioni e ritardi), `fairgive-grant-drawdowns` (importi richiedibili, costi vecchi, eccedenze), `fairgive-single-audit` (spese federali rispetto alla soglia del single audit), `fairgive-payroll-allocation` (costi del personale rispetto all’impegno).

**Fondi, patrimonio netto e liquidità (6):** `fairgive-fund-balances` (saldi dei fondi per vincolo), `fairgive-restriction-releases` (svincoli e scrittura contabile), `fairgive-board-designated` (fondi vincolati dal consiglio rispetto alle delibere), `fairgive-endowment-draw` (prelievo dal fondo secondo la politica), `fairgive-liquidity` (attività finanziarie disponibili entro un anno), `fairgive-pledges` (promesse da incassare, anzianità e stralci).

**Spese, paghe e chiusura (4):** `fairgive-functional-expenses` (ripartizione programmi, gestione, raccolta fondi), `fairgive-expense-reports` (note spese rispetto alla vostra politica), `fairgive-vendor-1099` (preparazione 1099, W-9 e codici fiscali), `fairgive-form-990-data` (dati per gli allegati del modulo 990 (nessun invio)).

## Come restano sicuri

- **Un compito ciascuno.** Ogni agente ha il proprio elenco di strumenti; qualsiasi altro nome viene bloccato.
- **Nulla di vincolante accade da sé.** Nessun agente paga, rimborsa, addebita carte, registra scritture, modifica il CRM, presenta moduli o invia lettere. Viene rifiutato o attende il clic di una persona indicata per nome, anche in modalità Auto.
- **I dati personali sono mascherati.** Nomi, e-mail, telefoni, indirizzi e codici fiscali sono sostituiti da codici in tutto ciò che torna al modello di IA. I file sul vostro computer conservano i valori reali.
- **Solo file locali.** Nessuna chiamata di rete, nessuna telemetria, nessuna credenziale. Ogni chiamata finisce in un registro di audit concatenato in `.fairgive/`.
- **Le vostre regole.** Soglie, aliquote, date e politiche sono impostazioni nel vostro file; il risultato indica sempre quali sono state usate.

## Sviluppo

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

## Come sono testati

Ogni controllo con i suoi numeri è in [REVIEW-ver1.md](REVIEW-ver1.md) (in inglese).

## Limiti

- I tracciati delle colonne degli export con nome sono stati scritti in base alla conoscenza dei sistemi e non verificati su un account reale.
- Soglie e regole (IRS, regole federali sui contributi, leggi statali sui fondi di dotazione, condizioni dei finanziatori) cambiano; sono impostazioni che il vostro commercialista, revisore o avvocato conferma.
- Non è consulenza legale, fiscale, di revisione o contabile. Nulla viene presentato e nessun denaro viene spostato.
- Le traduzioni di questi README e delle pagine dei report sono state scritte da Claude e non sono state riviste da madrelingua.

## Licenza

MIT © 2026 Kurt Francisco
