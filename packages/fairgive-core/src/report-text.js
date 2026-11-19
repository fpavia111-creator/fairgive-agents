// The words on a report page, in the nine report languages: page headings, section
// headings and the common column names. `--lang` (or FAIRGIVE_LANG) picks the language.
//
// What does not change with the language: the CSV file (its column names are read by
// scripts), finding codes and status values, the finding sentences and the notes under
// "Limits". A page in another language says so in its footer.
//
// Translations are written by Claude and marked for review by a native speaker.
// A string with no translation is shown in English, never left blank.
import { normLang } from './lang.js';

const ORDER = ['de', 'fr', 'es', 'pt', 'it', 'ja', 'zh', 'ko'];

// English: [de, fr, es, pt, it, ja, zh, ko]. {d} is a date, {1} {2} are numbers.
const PAGE = {
  'All rows ({1})': ['Alle Zeilen ({1})', 'Toutes les lignes ({1})', 'Todas las filas ({1})', 'Todas as linhas ({1})', 'Tutte le righe ({1})', '全行（{1}）', '全部行（{1}）', '전체 행 ({1})'],
  Limits: ['Grenzen', 'Limites', 'Límites', 'Limites', 'Limiti', '制限事項', '限制说明', '한계'],
  'None.': ['Keine.', 'Aucun.', 'Ninguno.', 'Nenhum.', 'Nessuno.', 'なし。', '无。', '없음.'],
  'Written by a Fairgive agent from your files. Nothing was sent or paid.': [
    'Von einem Fairgive-Agenten aus Ihren Dateien erstellt. Es wurde nichts gesendet oder bezahlt.',
    'Rédigé par un agent Fairgive à partir de vos fichiers. Rien n’a été envoyé ni payé.',
    'Escrito por un agente Fairgive a partir de sus archivos. No se envió ni se pagó nada.',
    'Escrito por um agente Fairgive a partir dos seus arquivos. Nada foi enviado nem pago.',
    'Scritto da un agente Fairgive a partire dai vostri file. Nulla è stato inviato o pagato.',
    'Fairgive エージェントがお客様のファイルから作成しました。送信も支払いも行っていません。',
    '由 Fairgive 智能体根据您的文件生成。未发送任何内容，也未付款。',
    'Fairgive 에이전트가 귀사의 파일로 작성했습니다. 아무것도 전송하거나 지급하지 않았습니다.'],
  'The summary line, finding texts, codes and the notes under Limits are in English. This page was translated by Claude; a native speaker has not reviewed it yet.': [
    'Die Zusammenfassung, die Befundtexte, die Codes und die Hinweise unter „Grenzen“ sind auf Englisch. Diese Seite wurde von Claude übersetzt; eine Prüfung durch Muttersprachler steht noch aus.',
    'La ligne de synthèse, les textes des constats, les codes et les notes sous « Limites » sont en anglais. Cette page a été traduite par Claude ; elle n’a pas encore été relue par un locuteur natif.',
    'La línea de resumen, los textos de los hallazgos, los códigos y las notas de «Límites» están en inglés. Esta página fue traducida por Claude; todavía no la ha revisado un hablante nativo.',
    'A linha de resumo, os textos dos apontamentos, os códigos e as notas em “Limites” estão em inglês. Esta página foi traduzida pelo Claude; ainda não foi revisada por um falante nativo.',
    'La riga di sintesi, i testi dei rilievi, i codici e le note sotto «Limiti» sono in inglese. Questa pagina è stata tradotta da Claude; non è ancora stata rivista da un madrelingua.',
    '概要行、指摘の本文、コード、「制限事項」の注記は英語です。このページは Claude が翻訳しました。ネイティブによる確認はまだ行われていません。',
    '摘要行、发现项的文字、代码以及“限制说明”下的备注为英文。本页由 Claude 翻译，尚未经母语人士审校。',
    '요약 문장, 지적 사항의 문구, 코드와 “한계” 아래의 주석은 영어입니다. 이 페이지는 Claude가 번역했으며 원어민 검토는 아직 이루어지지 않았습니다.'],
};

// Report titles, one per Fairgive agent.
const TITLES = {
  'Gift and deposit reconciliation': ['Abgleich von Spenden und Einzahlungen', 'Rapprochement des dons et des remises en banque', 'Conciliación de donaciones y depósitos', 'Conciliação de doações e depósitos', 'Riconciliazione di donazioni e versamenti', '寄付と入金の照合', '捐赠与存款对账', '기부금과 입금 대사'],
  'Fund balances by restriction': ['Fondssalden nach Zweckbindung', 'Soldes des fonds par restriction', 'Saldos de fondos por restricción', 'Saldos de fundos por restrição', 'Saldi dei fondi per vincolo', '使途制限別の基金残高', '按限定性划分的基金余额', '제한 구분별 기금 잔액'],
  'Releases from restriction': ['Freigaben aus Zweckbindung', 'Libérations de restrictions', 'Liberaciones de restricciones', 'Liberações de restrição', 'Svincoli da vincoli', '使途制限の解除', '限定解除', '제한 해제'],
  'Donor acknowledgements': ['Dankschreiben an Spender', 'Remerciements aux donateurs', 'Agradecimientos a donantes', 'Agradecimentos aos doadores', 'Ringraziamenti ai donatori', '寄付者へのお礼状', '捐赠人致谢函', '기부자 감사장'],
  'Duplicate donor records': ['Doppelte Spenderdatensätze', 'Fiches donateurs en double', 'Registros de donantes duplicados', 'Cadastros de doadores duplicados', 'Anagrafiche donatori duplicate', '重複した寄付者レコード', '重复的捐赠人记录', '중복 기부자 레코드'],
  'Recurring gifts': ['Dauerspenden', 'Dons réguliers', 'Donaciones recurrentes', 'Doações recorrentes', 'Donazioni ricorrenti', '継続寄付', '定期捐赠', '정기 기부'],
  'Lapsed donors': ['Inaktive Spender', 'Donateurs perdus', 'Donantes inactivos', 'Doadores inativos', 'Donatori persi', '休眠寄付者', '流失的捐赠人', '이탈 기부자'],
  'Grant budget against actual': ['Förderbudget gegenüber Ist', 'Budget des subventions face au réalisé', 'Presupuesto de subvenciones frente a lo ejecutado', 'Orçamento dos convênios frente ao realizado', 'Budget dei contributi rispetto al consuntivo', '助成金の予算と実績', '资助预算与实际对比', '보조금 예산 대비 실적'],
  'Grant reporting deadlines': ['Berichtsfristen für Fördermittel', 'Échéances des rapports de subvention', 'Plazos de informes de subvenciones', 'Prazos de relatórios de convênios', 'Scadenze delle rendicontazioni', '助成金の報告期限', '资助报告截止日期', '보조금 보고 기한'],
  'Grant drawdowns': ['Mittelabrufe', 'Appels de fonds des subventions', 'Solicitudes de desembolso de subvenciones', 'Solicitações de repasse', 'Richieste di erogazione dei contributi', '助成金の交付請求', '资助拨款申请', '보조금 교부 신청'],
  'Federal awards and the single audit threshold': ['Bundesfördermittel und Single-Audit-Schwelle', 'Subventions fédérales et seuil de l’audit unique', 'Fondos federales y umbral de auditoría única', 'Recursos federais e limite da auditoria única', 'Contributi federali e soglia del single audit', '連邦補助金とシングルオーディットの基準額', '联邦资助与单一审计门槛', '연방 보조금과 단일감사 기준액'],
  'In-kind gifts': ['Sachspenden', 'Dons en nature', 'Donaciones en especie', 'Doações em espécie', 'Donazioni in natura', '現物寄付', '实物捐赠', '현물 기부'],
  'Pledges receivable': ['Offene Spendenzusagen', 'Promesses de dons à recevoir', 'Promesas de donación por cobrar', 'Promessas de doação a receber', 'Promesse di donazione da incassare', '寄付約束の未収金', '应收认捐款', '미수 기부약정'],
  'Pledges receivable as of {d}': ['Offene Spendenzusagen, Stand {d}', 'Promesses de dons à recevoir au {d}', 'Promesas de donación por cobrar al {d}', 'Promessas de doação a receber em {d}', 'Promesse di donazione da incassare al {d}', '寄付約束の未収金（{d} 時点）', '截至 {d} 的应收认捐款', '{d} 기준 미수 기부약정'],
  'Quid pro quo disclosures': ['Hinweise auf Gegenleistungen', 'Mentions des contreparties', 'Avisos de contraprestación', 'Avisos de contrapartida', 'Avvisi di controprestazione', '返礼品の開示', '回馈披露', '답례품 고지'],
  'Event revenue split': ['Aufteilung der Veranstaltungseinnahmen', 'Ventilation des recettes des événements', 'Desglose de ingresos de eventos', 'Divisão das receitas de eventos', 'Ripartizione dei ricavi degli eventi', 'イベント収入の内訳', '活动收入拆分', '행사 수입 구분'],
  'Payment processor fees': ['Gebühren der Zahlungsanbieter', 'Frais des prestataires de paiement', 'Comisiones de procesadores de pago', 'Taxas dos processadores de pagamento', 'Commissioni dei gateway di pagamento', '決済代行の手数料', '支付渠道手续费', '결제대행 수수료'],
  'Matching gift claims': ['Anträge auf Arbeitgeber-Verdopplung', 'Demandes d’abondement employeur', 'Solicitudes de donación equivalente', 'Pedidos de doação equivalente', 'Richieste di raddoppio aziendale', 'マッチングギフトの申請', '配捐申请', '매칭 기부 신청'],
  'Donor-advised fund grants': ['Zuwendungen aus Donor-Advised Funds', 'Dons issus de fonds orientés par le donateur', 'Donaciones de fondos asesorados por donantes', 'Doações de fundos aconselhados por doadores', 'Erogazioni da fondi consigliati dai donatori', 'ドナー・アドバイズド・ファンドからの助成', '捐赠人建议基金拨款', '기부자 조언 기금 출연'],
  'Functional expenses': ['Aufwendungen nach Funktionsbereichen', 'Charges par destination', 'Gastos por función', 'Despesas por função', 'Oneri per destinazione', '機能別費用', '按功能分类的费用', '기능별 비용'],
  'Form 990 schedule data readiness': ['Datenbereitschaft für die Anlagen zum Formular 990', 'Préparation des données des annexes du formulaire 990', 'Preparación de datos de los anexos del Formulario 990', 'Preparação dos dados dos anexos do Formulário 990', 'Preparazione dei dati per gli allegati del modulo 990', 'フォーム990別表のデータ準備', '990表附表数据准备情况', '양식 990 부속서류 데이터 준비'],
  'Board-designated funds': ['Vom Vorstand zweckbestimmte Mittel', 'Fonds affectés par le conseil d’administration', 'Fondos designados por la junta', 'Fundos designados pelo conselho', 'Fondi vincolati dal consiglio', '理事会指定基金', '理事会指定基金', '이사회 지정 기금'],
  'Volunteer hours': ['Ehrenamtsstunden', 'Heures de bénévolat', 'Horas de voluntariado', 'Horas de voluntariado', 'Ore di volontariato', 'ボランティア時間', '志愿服务时长', '자원봉사 시간'],
  'Memberships and renewals': ['Mitgliedschaften und Verlängerungen', 'Adhésions et renouvellements', 'Membresías y renovaciones', 'Associações e renovações', 'Iscrizioni e rinnovi', '会員資格と更新', '会员资格与续费', '회원 자격과 갱신'],
  'Giving statements': ['Jährliche Spendenübersichten', 'Relevés annuels de dons', 'Certificados anuales de donaciones', 'Extratos anuais de doações', 'Riepiloghi annuali delle offerte', '献金の年間明細', '年度奉献明细', '연간 헌금 명세서'],
  'Payroll allocation against effort': ['Lohnkostenverteilung gegenüber Arbeitszeitnachweis', 'Répartition de la paie face aux temps déclarés', 'Asignación de nómina frente a dedicación', 'Rateio da folha frente à dedicação', 'Ripartizione delle paghe rispetto all’impegno', '給与配賦と従事割合', '工资分摊与工时比例对比', '급여 배분 대비 업무 비율'],
  'Expense report checks': ['Prüfung der Spesenabrechnungen', 'Contrôle des notes de frais', 'Revisión de informes de gastos', 'Verificação de relatórios de despesas', 'Controllo delle note spese', '経費精算の確認', '费用报销检查', '경비 보고서 점검'],
  '1099 readiness': ['Vorbereitung der Formulare 1099', 'Préparation des formulaires 1099', 'Preparación de formularios 1099', 'Preparação dos formulários 1099', 'Preparazione dei moduli 1099', 'フォーム1099の準備状況', '1099表准备情况', '1099 양식 준비 상태'],
  'Endowment draw': ['Entnahme aus dem Stiftungsvermögen', 'Prélèvement sur la dotation', 'Retiro del fondo patrimonial', 'Resgate do fundo patrimonial', 'Prelievo dal fondo di dotazione', '基本財産からの取り崩し', '留本基金支取', '기본재산 인출'],
  'Indirect cost recovery': ['Erstattung indirekter Kosten', 'Recouvrement des coûts indirects', 'Recuperación de costos indirectos', 'Recuperação de custos indiretos', 'Recupero dei costi indiretti', '間接費の回収', '间接费用回收', '간접비 회수'],
  'Gift coding': ['Kontierung der Spenden', 'Codification des dons', 'Codificación de donaciones', 'Codificação das doações', 'Codifica delle donazioni', '寄付のコード付け', '捐赠编码', '기부금 코드 분류'],
  'Refunds and chargebacks': ['Erstattungen und Rückbuchungen', 'Remboursements et rétrofacturations', 'Reembolsos y contracargos', 'Reembolsos e estornos', 'Rimborsi e riaddebiti', '返金とチャージバック', '退款与拒付', '환불과 지불거절'],
  'Liquidity and availability': ['Liquidität und Verfügbarkeit', 'Liquidités et disponibilité', 'Liquidez y disponibilidad', 'Liquidez e disponibilidade', 'Liquidità e disponibilità', '流動性と利用可能性', '流动性与可用性', '유동성과 가용성'],
  'Tribute gifts and notifications': ['Anlassspenden und Benachrichtigungen', 'Dons en hommage et avis', 'Donaciones en homenaje y avisos', 'Doações em homenagem e avisos', 'Donazioni in memoria o in onore e avvisi', '記念寄付と通知', '纪念捐赠与通知', '기념 기부와 알림'],
  'Operating budget against actual': ['Betriebsbudget gegenüber Ist', 'Budget de fonctionnement face au réalisé', 'Presupuesto operativo frente a lo ejecutado', 'Orçamento operacional frente ao realizado', 'Budget operativo rispetto al consuntivo', '事業予算と実績', '运营预算与实际对比', '운영 예산 대비 실적'],
};

const SECTIONS = {
  'By finding': ['Nach Befund', 'Par constat', 'Por hallazgo', 'Por apontamento', 'Per rilievo', '指摘別', '按发现项', '지적 사항별'],
  'By status': ['Nach Status', 'Par statut', 'Por estado', 'Por situação', 'Per stato', 'ステータス別', '按状态', '상태별'],
  'By month': ['Nach Monat', 'Par mois', 'Por mes', 'Por mês', 'Per mese', '月別', '按月', '월별'],
  'By fund': ['Nach Fonds', 'Par fonds', 'Por fondo', 'Por fundo', 'Per fondo', '基金別', '按基金', '기금별'],
  'By restriction class': ['Nach Zweckbindungsklasse', 'Par catégorie de restriction', 'Por clase de restricción', 'Por classe de restrição', 'Per classe di vincolo', '使途制限区分別', '按限定类别', '제한 구분별'],
  'By rule': ['Nach Regel', 'Par règle', 'Por regla', 'Por regra', 'Per regola', 'ルール別', '按规则', '규칙별'],
  'By processor': ['Nach Zahlungsanbieter', 'Par prestataire de paiement', 'Por procesador', 'Por processador', 'Per gateway', '決済代行別', '按支付渠道', '결제사별'],
  Retention: ['Spenderbindung', 'Fidélisation', 'Retención', 'Retenção', 'Fidelizzazione', '継続率', '留存', '유지율'],
  'By segment': ['Nach Segment', 'Par segment', 'Por segmento', 'Por segmento', 'Per segmento', 'セグメント別', '按细分', '세그먼트별'],
  'By grant': ['Nach Förderprojekt', 'Par subvention', 'Por subvención', 'Por convênio', 'Per contributo', '助成金別', '按资助项目', '보조금별'],
  'By assistance listing': ['Nach Förderprogrammnummer (ALN)', 'Par numéro de programme (ALN)', 'Por número de programa (ALN)', 'Por número do programa (ALN)', 'Per numero di programma (ALN)', '補助プログラム番号（ALN）別', '按援助项目编号（ALN）', '지원 프로그램 번호(ALN)별'],
  'By category': ['Nach Kategorie', 'Par catégorie', 'Por categoría', 'Por categoria', 'Per categoria', 'カテゴリ別', '按类别', '범주별'],
  Aging: ['Altersstruktur', 'Ancienneté', 'Antigüedad', 'Vencimento', 'Anzianità', '経過期間別', '账龄', '경과 기간'],
  'By event': ['Nach Veranstaltung', 'Par événement', 'Por evento', 'Por evento', 'Per evento', 'イベント別', '按活动', '행사별'],
  'By employer': ['Nach Arbeitgeber', 'Par employeur', 'Por empleador', 'Por empregador', 'Per datore di lavoro', '勤務先別', '按雇主', '고용주별'],
  'By sponsor': ['Nach Trägerorganisation', 'Par organisme gestionnaire', 'Por entidad patrocinadora', 'Por entidade patrocinadora', 'Per ente gestore', 'スポンサー団体別', '按发起机构', '후원 기관별'],
  'By function': ['Nach Funktionsbereich', 'Par destination', 'Por función', 'Por função', 'Per destinazione', '機能別', '按功能', '기능별'],
  'Natural expense by function': ['Aufwandsarten nach Funktionsbereich', 'Charges par nature et par destination', 'Gastos por naturaleza y función', 'Despesas por natureza e função', 'Oneri per natura e destinazione', '性質別・機能別の費用', '按性质和功能划分的费用', '성격별·기능별 비용'],
  'By schedule': ['Nach Anlage', 'Par annexe', 'Por anexo', 'Por anexo', 'Per allegato', '別表別', '按附表', '부속서류별'],
  'By program': ['Nach Programm', 'Par programme', 'Por programa', 'Por programa', 'Per programma', 'プログラム別', '按项目', '프로그램별'],
  'By level': ['Nach Stufe', 'Par niveau', 'Por nivel', 'Por nível', 'Per livello', '会員種別別', '按等级', '등급별'],
  'By employee': ['Nach Mitarbeiter', 'Par salarié', 'Por empleado', 'Por funcionário', 'Per dipendente', '従業員別', '按员工', '직원별'],
  'By giver': ['Nach Geber', 'Par donateur', 'Por donante', 'Por doador', 'Per offerente', '献金者別', '按奉献人', '헌금자별'],
  'By donor': ['Nach Spender', 'Par donateur', 'Por donante', 'Por doador', 'Per donatore', '寄付者別', '按捐赠人', '기부자별'],
  'By vendor': ['Nach Lieferant', 'Par fournisseur', 'Por proveedor', 'Por fornecedor', 'Per fornitore', '仕入先別', '按供应商', '공급업체별'],
  'By account': ['Nach Konto', 'Par compte', 'Por cuenta', 'Por conta', 'Per conto', '勘定科目別', '按科目', '계정별'],
  'By appeal': ['Nach Spendenaufruf', 'Par appel', 'Por llamamiento', 'Por apelo', 'Per appello', '募金依頼別', '按募捐呼吁', '모금 요청별'],
  'By form': ['Nach Formular', 'Par formulaire', 'Por formulario', 'Por formulário', 'Per modulo', '様式別', '按表格', '양식별'],
  'Settings used': ['Verwendete Einstellungen', 'Paramètres utilisés', 'Configuración utilizada', 'Configurações utilizadas', 'Impostazioni utilizzate', '使用した設定', '使用的设置', '사용한 설정'],
  Calendar: ['Kalender', 'Calendrier', 'Calendario', 'Calendário', 'Calendario', 'カレンダー', '日历', '일정'],
  'Draw by fund': ['Entnahme nach Fonds', 'Prélèvement par fonds', 'Retiro por fondo', 'Resgate por fundo', 'Prelievo per fondo', '基金別の取り崩し額', '按基金的支取额', '기금별 인출액'],
  'Pairs to review': ['Zu prüfende Paare', 'Paires à examiner', 'Pares por revisar', 'Pares a revisar', 'Coppie da verificare', '確認が必要な組', '待核对的配对', '검토할 쌍'],
  'Available within one year': ['Innerhalb eines Jahres verfügbar', 'Disponible dans l’année', 'Disponible en un año', 'Disponível em um ano', 'Disponibile entro un anno', '1年以内に利用可能', '一年内可用', '1년 이내 사용 가능'],
  'Gifts of {1} or more': ['Spenden ab {1}', 'Dons de {1} ou plus', 'Donaciones de {1} o más', 'Doações de {1} ou mais', 'Donazioni da {1} in su', '{1} 以上の寄付', '{1} 及以上的捐赠', '{1} 이상 기부'],
};

// Column names used by two or more agents. A column with no entry keeps its English name on the page.
const COLUMNS = {
  amount: ['Betrag', 'Montant', 'Importe', 'Valor', 'Importo', '金額', '金额', '금액'],
  status: ['Status', 'Statut', 'Estado', 'Situação', 'Stato', 'ステータス', '状态', '상태'],
  donor: ['Spender', 'Donateur', 'Donante', 'Doador', 'Donatore', '寄付者', '捐赠人', '기부자'],
  fund: ['Fonds', 'Fonds', 'Fondo', 'Fundo', 'Fondo', '基金', '基金', '기금'],
  grant: ['Förderprojekt', 'Subvention', 'Subvención', 'Convênio', 'Contributo', '助成金', '资助项目', '보조금'],
  count: ['Anzahl', 'Nombre', 'Cantidad', 'Quantidade', 'Numero', '件数', '数量', '건수'],
  total: ['Summe', 'Total', 'Total', 'Total', 'Totale', '合計', '合计', '합계'],
  findings: ['Befunde', 'Constats', 'Hallazgos', 'Apontamentos', 'Rilievi', '指摘', '发现项', '지적 사항'],
  reasons: ['Begründung', 'Motifs', 'Motivos', 'Motivos', 'Motivazioni', '理由', '原因', '사유'],
  month: ['Monat', 'Mois', 'Mes', 'Mês', 'Mese', '月', '月份', '월'],
  program: ['Programm', 'Programme', 'Programa', 'Programa', 'Programma', 'プログラム', '项目', '프로그램'],
  setting: ['Einstellung', 'Paramètre', 'Configuración', 'Configuração', 'Impostazione', '設定', '设置', '설정'],
  value: ['Wert', 'Valeur', 'Valor', 'Valor', 'Valore', '値', '值', '값'],
  code: ['Code', 'Code', 'Código', 'Código', 'Codice', 'コード', '代码', '코드'],
};

// Measure names an agent passes as labels.
const LABELS = {
  'Retention %': ['Bindungsquote %', 'Taux de fidélisation %', 'Tasa de retención %', 'Taxa de retenção %', 'Tasso di fidelizzazione %', '継続率 %', '留存率 %', '유지율 %'],
};

/** Every catalog, for the tests: { name: { english: [8 translations] } }. */
export const REPORT_TEXT = Object.freeze({ page: PAGE, titles: TITLES, sections: SECTIONS, columns: COLUMNS, labels: LABELS });
export const ENGLISH_NOTE = 'The summary line, finding texts, codes and the notes under Limits are in English. This page was translated by Claude; a native speaker has not reviewed it yet.';

const DATE = /\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?/;
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : vars[k]));

/** Find a phrase in a catalog: as written, then with its date as {d}, then with its numbers as {1} {2}. */
function lookup(cat, s) {
  if (Object.hasOwn(cat, s)) return [cat[s], {}];
  const d = DATE.exec(s);
  if (d) { const k = s.replace(DATE, '{d}'); if (Object.hasOwn(cat, k)) return [cat[k], { d: d[0] }]; }
  const vars = {}; let n = 0; const k = s.replace(/\d+(?:\.\d+)?/g, (m) => { vars[++n] = m; return `{${n}}`; });
  return n && Object.hasOwn(cat, k) ? [cat[k], vars] : [null, {}];
}

/**
 * Text for a report page in one language:
 *   t.page(s), t.title(s), t.section(s)  a phrase, translated when the catalog has it;
 *   t.column(name, label)                a column heading (label is the agent's own, when it set one);
 *   t.english                            true when nothing is translated.
 */
export function reportText(lang) {
  const l = normLang(lang); const i = ORDER.indexOf(l);
  const tr = (cat) => (s) => { if (i < 0) return s; const [hit, vars] = lookup(cat, String(s)); return hit && hit[i] ? fill(hit[i], vars) : s; };
  const label = tr(LABELS);
  return {
    lang: l, english: i < 0, page: tr(PAGE), title: tr(TITLES), section: tr(SECTIONS),
    column: (name, own) => { if (own) return label(own); if (i >= 0 && Object.hasOwn(COLUMNS, name) && COLUMNS[name][i]) return COLUMNS[name][i]; return String(name).replace(/_/g, ' '); },
  };
}
