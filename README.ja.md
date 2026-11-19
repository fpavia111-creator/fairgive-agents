# Fairgive 非営利団体向けエージェント

*Claude による翻訳です。ネイティブによる確認はまだ行われていません。英語版の [README](README.md) が優先します。*

非営利団体・財団・教会・協会のバックオフィス向けの、32 個の小さな MCP エージェントです。それぞれが**一つの仕事**（寄付と入金の照合、使途制限の解除、助成金の交付請求、年間献金明細など）だけを担当し、それ以外のことはできません。寄付者 CRM、決済代行、会計ソフトからすでに書き出しているファイルを読み、レポートをお使いのコンピューターに書き、送金・メッセージ送信・行政や助成元への提出・本番システムの変更の前には、名前の分かる担当者を待ちます。

Mythos Machines の Fair Agents の一部です。MIT ライセンス · Node 20 以上 · ローカルファイルのみ · 認証情報なし · 依存関係なし。ソフトウェアは無料で、有料なのはお客様のファイルでの固定価格のセットアップです。

## 試してみる

```bash
npx -y fairgive-gift-deposits demo     # 寄付と入金・総勘定元帳の照合（架空のデータ）
npx -y fairgive-grant-budgets demo     # 助成金の予算と実績（共通費の配賦あり）
```

各エージェントには架空のファイルでの `demo`、独自のテストケースを持つ `eval`、MCP サーバー（`npx -y <agent> mcp --root <フォルダー>`）があります。

## エージェント一覧

**寄付と寄付者 (10):** `fairgive-gift-deposits` (CRMの寄付と入金・総勘定元帳の照合), `fairgive-acknowledgements` (未送付・遅延・誤記のお礼状), `fairgive-duplicate-donors` (重複した寄付者レコード), `fairgive-recurring-gifts` (継続寄付の失敗と期限切れカード), `fairgive-lapsed-donors` (LYBUNT・SYBUNTと継続率), `fairgive-gift-coding` (寄付者の意図と異なるコード付け), `fairgive-matching-gifts` (未申請のマッチングギフトと期限), `fairgive-daf-grants` (確認が必要なDAFからの助成), `fairgive-refunds-chargebacks` (返金・チャージバックとCRMの寄付), `fairgive-processor-fees` (Stripe・PayPal・Givebutter・Classyの手数料と入金).

**イベント・返礼品・会員・ボランティア (6):** `fairgive-quid-pro-quo` (返礼品の開示と控除対象額), `fairgive-event-revenue` (チケットを対価部分と寄付部分に分割), `fairgive-in-kind-gifts` (現物寄付の評価・鑑定・役務), `fairgive-memberships` (会費・更新・失効会員), `fairgive-giving-statements` (教会・団体の年間献金明細), `fairgive-volunteer-hours` (ボランティア時間・評価額・身元確認).

**助成金 (6):** `fairgive-grant-budgets` (助成金の予算と実績、共通費の配賦), `fairgive-indirect-costs` (間接費の基礎（MTDC）と率), `fairgive-grant-reports` (報告カレンダーと期限超過の報告), `fairgive-grant-drawdowns` (請求可能額・古い費用・過大請求), `fairgive-single-audit` (連邦補助金支出とシングルオーディット基準額), `fairgive-payroll-allocation` (給与配賦と従事報告).

**基金・純資産・資金 (6):** `fairgive-fund-balances` (使途制限別の基金残高), `fairgive-restriction-releases` (使途制限の解除と仕訳), `fairgive-board-designated` (理事会指定基金と決議), `fairgive-endowment-draw` (支出方針による基本財産の取り崩し), `fairgive-liquidity` (1年以内に利用可能な金融資産), `fairgive-pledges` (寄付約束の未収金・経過・償却).

**経費・給与・年度末 (4):** `fairgive-functional-expenses` (事業・管理・募金の機能別配分), `fairgive-expense-reports` (経費精算と規程の照合), `fairgive-vendor-1099` (1099の準備、W-9と納税者番号), `fairgive-form-990-data` (フォーム990別表のデータ（提出はしない）).

## 安全の仕組み

- **一つの仕事だけ。** 各エージェントには専用のツール許可リストがあり、それ以外のツール名はブロックされます。
- **拘束力のある操作は勝手に起きません。** 支払い・返金・カード請求・仕訳の計上・CRM の変更・申告や提出・手紙の送付は行いません。これらは拒否されるか、Auto モードでも名前の分かる担当者のクリックを待ちます。
- **個人データはマスクされます。** 氏名・メール・電話番号・住所・納税者番号は、AI モデルに返す内容ではトークンに置き換えられます。お使いのコンピューターに書かれるファイルには実際の値が残ります。メモや銀行の摘要などの自由記述はそのまま送られ、そこに書かれた氏名は、マスク対象の列にも同じ氏名がある場合にだけマスクされます。
- **ローカルファイルのみ。** ネットワーク通信・テレメトリ・認証情報はありません。すべての呼び出しは `.fairgive/` のハッシュ連鎖の監査ログに記録されます。
- **ルールはお客様のもの。** 基準額・率・日付・方針はお客様の設定ファイルにあり、結果には使った設定が必ず示されます。

## 開発

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

## テストの方法

すべてのチェックとその数値は [REVIEW-ver1.md](REVIEW-ver1.md)（英語）にあります。

## 制限事項

- 名前付きエクスポートの列構成は各システムの知識から書いたもので、実際のアカウントでは確認していません。
- 基準額や規則（IRS、連邦助成金の規則、州の基本財産法、助成元の条件）は変わります。設定として扱い、会計士・監査人・弁護士が確認します。
- 法律・税務・監査・会計の助言ではありません。何も提出せず、資金も動かしません。
- この README とレポートページの翻訳は Claude が作成したもので、ネイティブによる確認は行われていません。

## ライセンス

MIT © 2026 Kurt Francisco
