# Agentes Fairgive para organizaciones sin fines de lucro

*Traducido por Claude; pendiente de revisión por un hablante nativo. El [README](README.md) en inglés es el que prevalece.*

Treinta y dos pequeños agentes MCP para la administración de organizaciones sin fines de lucro, fundaciones, iglesias y asociaciones. Cada uno tiene **una sola tarea**, como donaciones frente a depósitos bancarios, liberaciones de restricciones, solicitudes de desembolso o certificados anuales de donaciones, y no puede actuar fuera de ella. Leen los archivos que ya exporta de su CRM de donantes, procesadores de pago y contabilidad, escriben sus informes en su computadora y esperan a una persona identificada antes de mover dinero, enviar un mensaje, presentar algo ante un gobierno o un financiador, o cambiar un sistema en producción.

Parte de Fair Agents de Mythos Machines. Licencia MIT · Node 20 o superior · solo archivos locales · sin credenciales · sin dependencias. El software es gratuito; lo que se paga es una implementación a precio fijo sobre sus propios archivos.

## Pruebe uno

```bash
npx -y fairgive-gift-deposits demo     # donaciones frente a depósitos y libro mayor, datos ficticios
npx -y fairgive-grant-budgets demo     # presupuesto de subvenciones frente a lo ejecutado
```

Cada agente tiene una `demo` con archivos ficticios, un `eval` con sus propios casos de prueba y un servidor MCP (`npx -y <agente> mcp --root <carpeta>`).

## Los agentes

**Donaciones y donantes (10):** `fairgive-gift-deposits` (donaciones del CRM frente a depósitos y libro mayor), `fairgive-acknowledgements` (agradecimientos faltantes, tardíos o erróneos), `fairgive-duplicate-donors` (registros de donantes duplicados), `fairgive-recurring-gifts` (donaciones recurrentes fallidas, tarjetas por vencer), `fairgive-lapsed-donors` (LYBUNT, SYBUNT y retención), `fairgive-gift-coding` (donaciones codificadas contra la intención del donante), `fairgive-matching-gifts` (donaciones equivalentes no solicitadas, plazos), `fairgive-daf-grants` (donaciones de DAF por revisar), `fairgive-refunds-chargebacks` (reembolsos y contracargos frente a donaciones del CRM), `fairgive-processor-fees` (comisiones y liquidaciones de Stripe, PayPal, Givebutter, Classy).

**Eventos, contraprestaciones, socios y voluntarios (6):** `fairgive-quid-pro-quo` (avisos de contraprestación e importes deducibles), `fairgive-event-revenue` (entradas divididas en contraprestación y donación), `fairgive-in-kind-gifts` (donaciones en especie: valores, tasaciones, servicios), `fairgive-memberships` (cuotas, renovaciones y socios inactivos), `fairgive-giving-statements` (certificados anuales para iglesias y organizaciones), `fairgive-volunteer-hours` (horas de voluntariado, valor y verificaciones).

**Subvenciones (6):** `fairgive-grant-budgets` (presupuesto frente a ejecutado, costos compartidos), `fairgive-indirect-costs` (base de costos indirectos (MTDC) y tasas), `fairgive-grant-reports` (calendario de informes e informes vencidos), `fairgive-grant-drawdowns` (importes a solicitar, costos antiguos, excesos), `fairgive-single-audit` (gasto federal frente al umbral de auditoría única), `fairgive-payroll-allocation` (cargos de nómina frente a dedicación).

**Fondos, activos netos y liquidez (6):** `fairgive-fund-balances` (saldos de fondos por restricción), `fairgive-restriction-releases` (liberaciones de restricciones y asiento), `fairgive-board-designated` (fondos designados por la junta frente a resoluciones), `fairgive-endowment-draw` (retiro del fondo patrimonial según la política), `fairgive-liquidity` (activos financieros disponibles en un año), `fairgive-pledges` (promesas por cobrar, antigüedad y castigos).

**Gastos, nómina y cierre anual (4):** `fairgive-functional-expenses` (reparto programas, administración, captación), `fairgive-expense-reports` (informes de gastos frente a su política), `fairgive-vendor-1099` (preparación de 1099, W-9 e identificadores fiscales), `fairgive-form-990-data` (datos de los anexos del Formulario 990 (sin presentar)).

## Cómo se mantienen seguros

- **Una tarea cada uno.** Cada agente tiene su propia lista de herramientas; cualquier otro nombre se bloquea.
- **Nada vinculante ocurre solo.** Ningún agente paga, reembolsa, cobra tarjetas, registra asientos, cambia el CRM, presenta formularios ni envía cartas. Eso se rechaza o espera el clic de una persona identificada, incluso en modo Auto.
- **Los datos personales se enmascaran.** Nombres, correos, teléfonos, direcciones e identificadores fiscales se sustituyen por fichas en todo lo que recibe el modelo de IA. Los archivos en su computadora conservan los valores reales. El texto libre (notas, conceptos bancarios) se envía tal cual: un nombre escrito allí solo se enmascara si también está en una columna enmascarada.
- **Solo archivos locales.** Sin llamadas de red, sin telemetría, sin credenciales. Cada llamada queda en un registro de auditoría encadenado en `.fairgive/`.
- **Sus reglas.** Umbrales, tasas, fechas y políticas son configuraciones en su propio archivo; el resultado siempre indica cuáles se usaron.

## Desarrollo

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

## Cómo se prueban

Cada verificación con sus cifras está en [REVIEW-ver1.md](REVIEW-ver1.md) (en inglés).

## Límites

- Los formatos de columnas de las exportaciones con nombre se escribieron a partir del conocimiento de esos sistemas y no se verificaron con una cuenta real.
- Umbrales y reglas (IRS, reglas federales de subvenciones, leyes estatales de fondos patrimoniales, términos de sus financiadores) cambian; son configuraciones que su contador, auditor o abogado confirma.
- No es asesoría legal, fiscal, de auditoría ni contable. No se presenta nada ni se mueve dinero.
- Las traducciones de estos README y de las páginas de informe las escribió Claude y no las han revisado hablantes nativos.

## Licencia

MIT © 2026 Kurt Francisco
