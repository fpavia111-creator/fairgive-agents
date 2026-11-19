# Fairgive 非营利组织智能体

*由 Claude 翻译，尚待母语人士审校。以英文 [README](README.md) 为准。*

三十二个小型 MCP 智能体，服务于非营利组织、基金会、教会和协会的后台工作。每个智能体只负责**一项工作**，例如捐赠与银行存款核对、限定解除、资助拨款申请或年度奉献明细，不能越界行事。它们读取您已从捐赠人 CRM、支付渠道和会计软件导出的文件，在您的电脑上生成报告，并在转移资金、发送消息、向政府或资助方提交材料或更改在用系统之前，等待一位具名人员确认。

属于 Mythos Machines 的 Fair Agents。MIT 许可 · Node 20 或更高版本 · 仅本地文件 · 无需凭据 · 无运行时依赖。软件免费；付费部分是在您自己的文件上进行的固定价格部署。

## 试用

```bash
npx -y fairgive-gift-deposits demo     # 捐赠与存款及总账核对，虚构数据
npx -y fairgive-grant-budgets demo     # 资助预算与实际（含共享成本）
```

每个智能体都有基于虚构文件的 `demo`、带自有测试用例的 `eval`，以及 MCP 服务器（`npx -y <agent> mcp --root <文件夹>`）。

## 智能体列表

**捐赠与捐赠人 (10):** `fairgive-gift-deposits` (CRM捐赠与银行存款及总账核对), `fairgive-acknowledgements` (缺失、迟发或有误的致谢函), `fairgive-duplicate-donors` (重复的捐赠人记录), `fairgive-recurring-gifts` (定期捐赠失败与即将过期的卡), `fairgive-lapsed-donors` (LYBUNT、SYBUNT与留存率), `fairgive-gift-coding` (与捐赠人意愿不符的编码), `fairgive-matching-gifts` (未申请的配捐与截止日期), `fairgive-daf-grants` (需核查的捐赠人建议基金拨款), `fairgive-refunds-chargebacks` (退款、拒付与CRM捐赠核对), `fairgive-processor-fees` (Stripe、PayPal、Givebutter、Classy手续费与结算).

**活动、回馈、会员与志愿者 (6):** `fairgive-quid-pro-quo` (回馈披露与可抵扣金额), `fairgive-event-revenue` (门票拆分为交换部分与捐赠部分), `fairgive-in-kind-gifts` (实物捐赠的估值、评估与服务), `fairgive-memberships` (会费、续费与失效会员), `fairgive-giving-statements` (教会和非营利组织的年度奉献明细), `fairgive-volunteer-hours` (志愿服务时长、价值与背景审查).

**资助 (6):** `fairgive-grant-budgets` (资助预算与实际、共享成本分摊), `fairgive-indirect-costs` (间接费用基数（MTDC）与费率), `fairgive-grant-reports` (报告日历与逾期报告), `fairgive-grant-drawdowns` (可申请金额、陈旧成本、超额拨付), `fairgive-single-audit` (联邦支出与单一审计门槛), `fairgive-payroll-allocation` (工资分摊与工时报告).

**基金、净资产与现金 (6):** `fairgive-fund-balances` (按限定性划分的基金余额), `fairgive-restriction-releases` (限定解除与分录), `fairgive-board-designated` (理事会指定基金与决议), `fairgive-endowment-draw` (按支出政策的留本基金支取), `fairgive-liquidity` (一年内可用的金融资产), `fairgive-pledges` (应收认捐、账龄与核销).

**费用、工资与年终 (4):** `fairgive-functional-expenses` (项目、管理与筹款的功能分配), `fairgive-expense-reports` (费用报销与贵组织政策核对), `fairgive-vendor-1099` (1099准备、W-9与纳税人识别号), `fairgive-form-990-data` (990表附表数据（不申报）).

## 如何保持安全

- **各司其职。** 每个智能体都有自己的工具白名单；任何其他工具名都会被拦截。
- **有约束力的操作不会自行发生。** 不会付款、退款、扣卡、记账、修改 CRM、提交表格或寄送信件。这些操作被拒绝，或即使在 Auto 模式下也要等待具名人员点击确认。
- **个人数据会被遮蔽。** 返回给 AI 模型的内容中，姓名、邮箱、电话、地址和纳税人识别号均被替换为标记。写在您电脑上的文件保留真实值。备注、银行摘要等自由文本按原样发送：其中写入的姓名只有在同一姓名也出现在被遮蔽的列中时才会被遮蔽。
- **仅本地文件。** 无网络调用、无遥测、无凭据。每次调用都写入 `.fairgive/` 下的哈希链审计日志。
- **规则由您决定。** 门槛、费率、日期和政策都是您自己文件中的设置；结果总会说明使用了哪些设置。

## 开发

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

## 如何测试

所有检查及数字见 [REVIEW-ver1.md](REVIEW-ver1.md)（英文）。

## 限制说明

- 具名导出的列布局根据对这些系统的了解编写，未在真实账户上核对。
- 门槛和规则（IRS、联邦资助规则、州留本基金法、资助方条款）会变化；它们是设置，由您的会计师、审计师或律师确认。
- 不构成法律、税务、审计或会计建议。不会提交任何材料，也不会转移资金。
- 这些 README 和报告页面的翻译由 Claude 撰写，尚未经母语人士审校。

## 许可证

MIT © 2026 Kurt Francisco
