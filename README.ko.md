# Fairgive 비영리단체 에이전트

*Claude가 번역했으며 원어민 검토는 아직입니다. 영어 [README](README.md)가 우선합니다.*

비영리단체·재단·교회·협회의 백오피스를 위한 32개의 작은 MCP 에이전트입니다. 각 에이전트는 **한 가지 일**(기부금과 입금 대사, 제한 해제, 보조금 교부 신청, 연간 헌금 명세서 등)만 맡으며 그 밖의 일은 할 수 없습니다. 기부자 CRM, 결제대행사, 회계 프로그램에서 이미 내보내는 파일을 읽고, 보고서를 사용자의 컴퓨터에 쓰며, 돈을 옮기거나 메시지를 보내거나 정부·지원기관에 제출하거나 운영 중인 시스템을 바꾸기 전에는 이름이 확인된 담당자를 기다립니다.

Mythos Machines의 Fair Agents에 속합니다. MIT 라이선스 · Node 20 이상 · 로컬 파일만 · 자격 증명 없음 · 의존성 없음. 소프트웨어는 무료이며, 유료 부분은 고객 파일에 대한 고정 가격 설치입니다.

## 사용해 보기

```bash
npx -y fairgive-gift-deposits demo     # 기부금과 입금·원장 대사, 가상 데이터
npx -y fairgive-grant-budgets demo     # 보조금 예산 대비 실적(공통비 배분)
```

각 에이전트에는 가상 파일로 하는 `demo`, 자체 테스트 사례가 있는 `eval`, MCP 서버(`npx -y <agent> mcp --root <폴더>`)가 있습니다.

## 에이전트 목록

**기부와 기부자 (10):** `fairgive-gift-deposits` (CRM 기부금과 입금·총계정원장 대사), `fairgive-acknowledgements` (누락·지연·오류 감사장), `fairgive-duplicate-donors` (중복 기부자 레코드), `fairgive-recurring-gifts` (정기 기부 실패와 만료 예정 카드), `fairgive-lapsed-donors` (LYBUNT·SYBUNT와 유지율), `fairgive-gift-coding` (기부자 의도와 다른 코드 분류), `fairgive-matching-gifts` (미신청 매칭 기부와 기한), `fairgive-daf-grants` (검토할 기부자 조언 기금 출연), `fairgive-refunds-chargebacks` (환불·지불거절과 CRM 기부금), `fairgive-processor-fees` (Stripe·PayPal·Givebutter·Classy 수수료와 정산).

**행사·답례품·회원·자원봉사 (6):** `fairgive-quid-pro-quo` (답례품 고지와 공제 대상 금액), `fairgive-event-revenue` (티켓을 대가와 기부로 구분), `fairgive-in-kind-gifts` (현물 기부의 가액·감정·용역), `fairgive-memberships` (회비·갱신·만료 회원), `fairgive-giving-statements` (교회·비영리단체 연간 헌금 명세서), `fairgive-volunteer-hours` (자원봉사 시간·가치·신원 확인).

**보조금 (6):** `fairgive-grant-budgets` (보조금 예산 대비 실적, 공통비 배분), `fairgive-indirect-costs` (간접비 기준(MTDC)과 비율), `fairgive-grant-reports` (보고 일정과 기한 초과 보고), `fairgive-grant-drawdowns` (청구 가능액·오래된 비용·초과 교부), `fairgive-single-audit` (연방 지출과 단일감사 기준액), `fairgive-payroll-allocation` (급여 배분과 업무 보고).

**기금·순자산·현금 (6):** `fairgive-fund-balances` (제한 구분별 기금 잔액), `fairgive-restriction-releases` (제한 해제와 분개), `fairgive-board-designated` (이사회 지정 기금과 결의), `fairgive-endowment-draw` (지출 정책에 따른 기본재산 인출), `fairgive-liquidity` (1년 내 사용 가능한 금융자산), `fairgive-pledges` (미수 기부약정·경과·대손).

**경비·급여·연말 (4):** `fairgive-functional-expenses` (사업·관리·모금 기능별 배분), `fairgive-expense-reports` (경비 보고서와 규정 대조), `fairgive-vendor-1099` (1099 준비, W-9와 납세자 번호), `fairgive-form-990-data` (양식 990 부속서류 데이터(제출 없음)).

## 안전을 지키는 방법

- **각자 한 가지 일.** 각 에이전트에는 자체 도구 허용 목록이 있으며 다른 도구 이름은 차단됩니다.
- **구속력 있는 일은 저절로 일어나지 않습니다.** 지급·환불·카드 청구·분개 기록·CRM 변경·신고나 제출·서신 발송을 하지 않습니다. 이런 일은 거부되거나 Auto 모드에서도 이름이 확인된 담당자의 클릭을 기다립니다.
- **개인 데이터는 가려집니다.** AI 모델에 돌려주는 내용에서 이름·이메일·전화번호·주소·납세자 번호는 토큰으로 바뀝니다. 사용자의 컴퓨터에 쓰인 파일에는 실제 값이 남습니다.
- **로컬 파일만.** 네트워크 호출·원격 측정·자격 증명이 없습니다. 모든 호출은 `.fairgive/` 아래 해시 연쇄 감사 로그에 기록됩니다.
- **규칙은 고객의 것.** 기준액·비율·날짜·정책은 고객의 설정 파일에 있으며, 결과에는 사용한 설정이 항상 표시됩니다.

## 개발

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

## 테스트 방법

모든 점검과 수치는 [REVIEW-ver1.md](REVIEW-ver1.md)(영어)에 있습니다.

## 한계

- 이름이 있는 내보내기의 열 구성은 각 시스템에 대한 지식으로 작성했으며 실제 계정에서 확인하지 않았습니다.
- 기준액과 규칙(IRS, 연방 보조금 규칙, 주 기본재산법, 지원기관 조건)은 바뀝니다. 설정이며 회계사·감사인·변호사가 확인합니다.
- 법률·세무·감사·회계 자문이 아닙니다. 아무것도 제출하지 않으며 돈을 옮기지 않습니다.
- 이 README와 보고서 페이지의 번역은 Claude가 작성했으며 원어민의 검토를 거치지 않았습니다.

## 라이선스

MIT © 2026 Kurt Francisco
