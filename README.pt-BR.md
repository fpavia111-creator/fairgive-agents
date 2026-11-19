# Agentes Fairgive para organizações sem fins lucrativos

*Traduzido pelo Claude; revisão por falante nativo pendente. O [README](README.md) em inglês prevalece.*

Trinta e dois pequenos agentes MCP para o back-office de organizações sem fins lucrativos, fundações, igrejas e associações. Cada um tem **uma única tarefa**, como doações frente a depósitos bancários, liberações de restrição, solicitações de repasse ou extratos anuais de doações, e não pode agir fora dela. Eles leem os arquivos que você já exporta do CRM de doadores, dos processadores de pagamento e da contabilidade, escrevem relatórios no seu computador e esperam uma pessoa nomeada antes de movimentar dinheiro, enviar uma mensagem, protocolar algo junto a um governo ou financiador, ou alterar um sistema em produção.

Parte do Fair Agents da Mythos Machines. Licença MIT · Node 20 ou mais recente · apenas arquivos locais · sem credenciais · sem dependências. O software é gratuito; o que se paga é uma implantação a preço fixo nos seus próprios arquivos.

## Experimente

```bash
npx -y fairgive-gift-deposits demo     # doações frente a depósitos e razão, dados fictícios
npx -y fairgive-grant-budgets demo     # orçamento de convênios frente ao realizado
```

Cada agente tem uma `demo` com arquivos fictícios, um `eval` com seus próprios casos de teste e um servidor MCP (`npx -y <agente> mcp --root <pasta>`).

## Os agentes

**Doações e doadores (10):** `fairgive-gift-deposits` (doações do CRM frente a depósitos e razão), `fairgive-acknowledgements` (agradecimentos ausentes, atrasados ou errados), `fairgive-duplicate-donors` (cadastros de doadores duplicados), `fairgive-recurring-gifts` (doações recorrentes com falha, cartões vencendo), `fairgive-lapsed-donors` (LYBUNT, SYBUNT e retenção), `fairgive-gift-coding` (doações codificadas contra a intenção do doador), `fairgive-matching-gifts` (doações equivalentes não solicitadas, prazos), `fairgive-daf-grants` (doações de DAF a revisar), `fairgive-refunds-chargebacks` (reembolsos e estornos frente às doações do CRM), `fairgive-processor-fees` (taxas e repasses de Stripe, PayPal, Givebutter, Classy).

**Eventos, contrapartidas, associados e voluntários (6):** `fairgive-quid-pro-quo` (avisos de contrapartida e valores dedutíveis), `fairgive-event-revenue` (ingressos divididos em contrapartida e doação), `fairgive-in-kind-gifts` (doações em espécie: valores, avaliações, serviços), `fairgive-memberships` (anuidades, renovações e associados inativos), `fairgive-giving-statements` (extratos anuais para igrejas e organizações), `fairgive-volunteer-hours` (horas de voluntariado, valor e checagens).

**Convênios e subvenções (6):** `fairgive-grant-budgets` (orçamento frente ao realizado, custos compartilhados), `fairgive-indirect-costs` (base de custos indiretos (MTDC) e taxas), `fairgive-grant-reports` (calendário de relatórios e atrasos), `fairgive-grant-drawdowns` (valores a solicitar, custos antigos, excessos), `fairgive-single-audit` (gastos federais frente ao limite da auditoria única), `fairgive-payroll-allocation` (encargos de folha frente à dedicação).

**Fundos, patrimônio líquido e caixa (6):** `fairgive-fund-balances` (saldos de fundos por restrição), `fairgive-restriction-releases` (liberações de restrição e lançamento), `fairgive-board-designated` (fundos designados pelo conselho frente a resoluções), `fairgive-endowment-draw` (resgate do fundo patrimonial pela política), `fairgive-liquidity` (ativos financeiros disponíveis em um ano), `fairgive-pledges` (promessas a receber, vencimento e baixas).

**Despesas, folha e fechamento (4):** `fairgive-functional-expenses` (divisão programas, gestão, captação), `fairgive-expense-reports` (relatórios de despesas frente à sua política), `fairgive-vendor-1099` (preparação de 1099, W-9 e identificadores fiscais), `fairgive-form-990-data` (dados dos anexos do Formulário 990 (sem envio)).

## Como eles se mantêm seguros

- **Uma tarefa cada.** Cada agente tem sua própria lista de ferramentas; qualquer outro nome é bloqueado.
- **Nada vinculante acontece sozinho.** Nenhum agente paga, reembolsa, cobra cartão, lança na contabilidade, altera o CRM, envia formulários ou cartas. Isso é recusado ou espera o clique de uma pessoa nomeada, mesmo no modo Auto.
- **Dados pessoais são mascarados.** Nomes, e-mails, telefones, endereços e identificadores fiscais são substituídos por códigos em tudo o que vai para o modelo de IA. Os arquivos no seu computador mantêm os valores reais.
- **Apenas arquivos locais.** Sem chamadas de rede, sem telemetria, sem credenciais. Cada chamada vai para um log de auditoria encadeado em `.fairgive/`.
- **Suas regras.** Limites, taxas, datas e políticas são configurações no seu próprio arquivo; o resultado sempre diz quais foram usadas.

## Desenvolvimento

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

## Como são testados

Cada verificação com seus números está em [REVIEW-ver1.md](REVIEW-ver1.md) (em inglês).

## Limites

- Os layouts de colunas das exportações nomeadas foram escritos a partir do conhecimento desses sistemas e não verificados em uma conta real.
- Limites e regras (IRS, regras federais de convênios, leis estaduais de fundos patrimoniais, termos dos financiadores) mudam; são configurações que seu contador, auditor ou advogado confirma.
- Não é aconselhamento jurídico, fiscal, de auditoria ou contábil. Nada é protocolado e nenhum dinheiro é movimentado.
- As traduções destes README e das páginas de relatório foram escritas pelo Claude e não foram revisadas por falantes nativos.

## Licença

MIT © 2026 Kurt Francisco
