# Fairgive-Agenten für gemeinnützige Organisationen

*Von Claude übersetzt; Prüfung durch Muttersprachler steht aus. Die englische [README](README.md) ist maßgeblich.*

Zweiunddreißig kleine MCP-Agenten für das Backoffice von gemeinnützigen Organisationen, Stiftungen, Kirchen und Vereinen. Jeder ist für **eine Aufgabe** zuständig, etwa Spenden gegen Bankeinzahlungen, Freigaben aus Zweckbindung, Mittelabrufe oder Jahresspendenübersichten, und kann nicht darüber hinaus handeln. Sie lesen die Dateien, die Sie bereits aus Spenden-CRM, Zahlungsanbietern und Buchhaltung exportieren, schreiben Berichte auf Ihrem Rechner und warten auf eine namentlich genannte Person, bevor Geld bewegt, eine Nachricht gesendet, etwas bei einer Behörde oder einem Fördergeber eingereicht oder ein laufendes System geändert wird.

Teil von Fair Agents von Mythos Machines. MIT-Lizenz · Node 20 oder neuer · nur lokale Dateien · keine Zugangsdaten · keine Abhängigkeiten. Die Software ist kostenlos; bezahlt wird eine Einrichtung zum Festpreis auf Ihren eigenen Dateien.

## Ausprobieren

```bash
npx -y fairgive-gift-deposits demo     # Spenden gegen Einzahlungen und Hauptbuch, fiktive Daten
npx -y fairgive-grant-budgets demo     # Förderbudget gegen Ist mit geteilten Kosten
```

Jeder Agent hat eine `demo` mit fiktiven Dateien, ein `eval` mit eigenen Testfällen und einen MCP-Server (`npx -y <agent> mcp --root <ordner>`).

## Die Agenten

**Spenden und Spender (10):** `fairgive-gift-deposits` (CRM-Spenden gegen Bankeinzahlungen und Hauptbuch), `fairgive-acknowledgements` (fehlende, späte oder falsche Dankschreiben), `fairgive-duplicate-donors` (doppelte Spenderdatensätze), `fairgive-recurring-gifts` (fehlgeschlagene Dauerspenden, ablaufende Karten), `fairgive-lapsed-donors` (LYBUNT, SYBUNT und Spenderbindung), `fairgive-gift-coding` (Spenden gegen den Spenderwillen kontiert), `fairgive-matching-gifts` (nicht beantragte Arbeitgeber-Verdopplungen, Fristen), `fairgive-daf-grants` (zu prüfende DAF-Zuwendungen), `fairgive-refunds-chargebacks` (Erstattungen und Rückbuchungen gegen CRM-Spenden), `fairgive-processor-fees` (Gebühren und Auszahlungen von Stripe, PayPal, Givebutter, Classy).

**Veranstaltungen, Gegenleistungen, Mitglieder, Ehrenamt (6):** `fairgive-quid-pro-quo` (Hinweise auf Gegenleistungen und abzugsfähige Beträge), `fairgive-event-revenue` (Tickets aufgeteilt in Gegenleistung und Spende), `fairgive-in-kind-gifts` (Sachspenden: Werte, Gutachten, Leistungen), `fairgive-memberships` (Beiträge, Verlängerungen, ausgetretene Mitglieder), `fairgive-giving-statements` (Jahresspendenübersichten für Kirchen und Vereine), `fairgive-volunteer-hours` (Ehrenamtsstunden, Wert und Führungszeugnisse).

**Fördermittel (6):** `fairgive-grant-budgets` (Förderbudget gegen Ist, geteilte Kosten), `fairgive-indirect-costs` (Basis indirekter Kosten (MTDC) und Sätze), `fairgive-grant-reports` (Berichtskalender und überfällige Berichte), `fairgive-grant-drawdowns` (abrufbare Mittel, alte Kosten, Überabrufe), `fairgive-single-audit` (Bundesmittel gegen die Single-Audit-Schwelle), `fairgive-payroll-allocation` (Lohnbelastungen gegen Arbeitszeitnachweise).

**Fonds, Nettovermögen und Liquidität (6):** `fairgive-fund-balances` (Fondssalden nach Zweckbindung), `fairgive-restriction-releases` (Freigaben aus Zweckbindung und Buchungssatz), `fairgive-board-designated` (vom Vorstand bestimmte Mittel gegen Beschlüsse), `fairgive-endowment-draw` (Entnahme aus dem Stiftungsvermögen nach Ausgabenpolitik), `fairgive-liquidity` (innerhalb eines Jahres verfügbare Finanzmittel), `fairgive-pledges` (offene Spendenzusagen, Altersstruktur, Abschreibungen).

**Ausgaben, Lohn und Jahresabschluss (4):** `fairgive-functional-expenses` (Aufteilung Programm, Verwaltung, Mittelbeschaffung), `fairgive-expense-reports` (Spesenabrechnungen gegen Ihre Richtlinie), `fairgive-vendor-1099` (Vorbereitung 1099, W-9 und Steuernummern), `fairgive-form-990-data` (Daten für die Anlagen zum Formular 990 (keine Einreichung)).

## Wie sie sicher bleiben

- **Je eine Aufgabe.** Jeder Agent hat seine eigene Werkzeugliste; jeder andere Werkzeugname wird blockiert.
- **Nichts Verbindliches geschieht von selbst.** Kein Agent zahlt, erstattet, belastet Karten, bucht, ändert das CRM, reicht Formulare ein oder versendet Briefe. Das wird abgelehnt oder wartet auf den Klick einer namentlich genannten Person, auch im Auto-Modus.
- **Personenbezogene Daten werden maskiert.** Namen, E-Mails, Telefonnummern, Anschriften und Steuernummern werden in allem, was an das KI-Modell geht, durch Kürzel ersetzt. Die Dateien auf Ihrem Rechner behalten die echten Werte. Freitext (Notizen, Verwendungszwecke) wird so gesendet, wie er geschrieben wurde: ein dort getippter Name wird nur maskiert, wenn er auch in einer maskierten Spalte steht.
- **Nur lokale Dateien.** Keine Netzwerkaufrufe, keine Telemetrie, keine Zugangsdaten. Jeder Aufruf landet in einem hash-verketteten Prüfprotokoll unter `.fairgive/`.
- **Ihre Regeln.** Schwellen, Sätze, Fristen und Richtlinien sind Einstellungen in Ihrer eigenen Datei; das Ergebnis nennt immer die verwendeten Einstellungen.

## Entwicklung

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

## Wie sie geprüft werden

Alle Prüfungen mit Zahlen stehen in [REVIEW-ver1.md](REVIEW-ver1.md) (Englisch).

## Grenzen

- Die Spaltenlayouts benannter Exporte wurden aus Kenntnis der Systeme geschrieben und nicht an einem echten Konto geprüft.
- Schwellen und Regeln (IRS, Bundesförderung, Stiftungsrecht der Bundesstaaten, Bedingungen Ihrer Geldgeber) ändern sich; es sind Einstellungen, die Ihre Steuerberatung oder Prüfung bestätigt.
- Keine Rechts-, Steuer-, Prüfungs- oder Buchhaltungsberatung. Nichts wird eingereicht, kein Geld wird bewegt.
- Die Übersetzungen dieser README und der Berichtsseiten stammen von Claude und wurden nicht von Muttersprachlern geprüft.

## Lizenz

MIT © 2026 Kurt Francisco
