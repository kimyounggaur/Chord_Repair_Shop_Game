# 도구와 재현 방법

기록일: 2026-10-19. S00 시점의 실제 `package.json`, `package-lock.json` 및 로컬 명령 출력을 기준으로 한다. 이 문서는 최신 버전 추천이나 이후 단계의 검증 결과가 아니다.

## 실행 환경

| 항목 | 확인값 |
|---|---|
| 작업 환경 | 현재 kimyounggaur PC, Windows / PowerShell |
| 작업 폴더 | `C:\Users\kimyo\Documents\Codex\2026-10-19\task-4\chord-repair-shop` |
| Node 실행값 | `v24.14.0` (`node --version`) |
| npm 실행값 | `11.9.0` (`npm --version`) |
| Node engines | `>=24.14.0` |
| 패키지 관리자 | npm만 사용 |
| lockfile | `package-lock.json`, `lockfileVersion: 3` |
| 개발 서버 | `http://127.0.0.1:5486`, strict port |
| production preview | `http://127.0.0.1:4486`, strict port |
| 빌드 출력 | `dist/`, Vite target `es2022` |

다른 게임과 포트가 겹치면 임의 포트로 이동하지 말고 사용 중인 프로세스를 확인한다. 이 작업은 기존 다른 게임의 서버를 종료할 권한을 전제로 하지 않는다.

## 고정 버전

아래 직접 의존성은 package 선언과 lockfile의 실제 해석 버전이 일치한다. 모두 exact 버전이다.

| 패키지 | 버전 |
|---|---|
| react | 19.3.1 |
| react-dom | 19.3.1 |
| typescript | 7.0.2 |
| vite | 8.3.4 |
| vitest | 5.0.5 |
| @playwright/test | 1.64.1 |
| @axe-core/playwright | 4.14.0 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.8 |
| @types/node | 26.6.5 |
| @types/react | 19.3.0 |
| @types/react-dom | 19.3.0 |
| fake-indexeddb | 6.2.6 |

주 실행 에이전트는 S00에서 공식 Vite 안내, MDN, Playwright 문서 및 npm registry의 버전/engines를 확인했다고 보고했다. 해당 브라우징·registry 출력은 작업 대화에 있으며 이 문서 작성 시 별도 로그 파일은 전달되지 않았다. 설치 버전 표는 그 보고와 별개로 package/lockfile을 직접 읽어 확인했다.

## 설치 및 실행

저장소 루트에서 다음 명령을 사용한다. `npm ci`는 재설치 방법이며, 아래 코드 블록 자체가 재실행 결과를 뜻하지 않는다.

```powershell
npm ci
npm run check
npm run dev
```

production 결과 확인은 `npm run build` 후 `npm run preview`를 사용한다. Playwright 브라우저 바이너리는 npm 의존성과 별도로 준비한다. 최초 문서 작성 후 주 실행 에이전트가 Chromium 156.0.8078.4 (Playwright browser build v1248) 설치 및 셸 검사 1개 통과를 보고했다. 기기 내 설치·셸 확인은 실제 휴대기기나 실제 오디오 검증을 뜻하지 않는다.

## 검사 명령의 범위

| 명령 | 실제 역할 | S00 증거 |
|---|---|---|
| `verify:reference` | 원본 주문 JSON deep equality, 독립 콘텐츠/음악 산술, 고의 손상 거부 검사 | `check` 안에서 성공 보고 |
| `typecheck` | `tsc --noEmit`, strict TypeScript | `check` 안에서 성공 보고 |
| `lint` | 자체 Node 스크립트로 unsafe escape와 도메인 import 방향 검사 | `check` 안에서 성공 보고 |
| `test:unit` | `tests/unit` Vitest | `check`에서 smoke 1개 성공 보고 |
| `test:integration` | `tests/integration` Vitest | 테스트 미구현 / NOT RUN |
| `test:audio` | `tests/audio` Vitest | 테스트 미구현 / NOT RUN |
| `test:content` | `tests/unit/content.test.ts` | 파일 미구현 / NOT RUN |
| `test:e2e` | `tests/e2e` Playwright | Chromium 최소 shell 검사 1개 성공; 게임 전체 E2E는 아직 미구현 |
| `test:a11y` | `tests/accessibility` Playwright | NOT RUN |
| `build` | reference → typecheck → Vite production build | 같은 구성 요소가 `check`에서 성공; 독립 `npm run build` 실행 증거 없음 |
| `check` | lint → reference → typecheck → Vitest → Vite build | 최초 및 로그 저장 재실행 exit 0; `evidence/S00-check.log` |

`check`의 Vitest 수집은 unit/integration/audio의 `*.test.ts`만 포함한다. Playwright E2E와 접근성 검사는 `check`에 포함되지 않는다. 아직 없는 테스트 그룹을 `passWithNoTests`로 통과시키지 않는다. 자체 lint는 ESLint 전체 규칙 집합이나 접근성 검사를 대신하지 않는다.

TypeScript 설정은 `strict: true`, `moduleResolution: bundler`, `jsx: react-jsx`, `noEmit: true`다. 현재 별도 import alias는 없다. 도메인은 React/DOM/오디오/저장 구현을 모르도록 유지한다.

## 증거 보관 상태

최초 S00 `npm run check` 결과는 콘솔과 주 실행 에이전트의 보고에만 있었다. 이후 로그 저장 재실행 결과는 `evidence/S00-check.log`에 있으며 문서 담당이 파일을 직접 읽었다. reference, 타입 검사, smoke 1개, production build의 성공 출력이 보존되어 있다. exit 0은 주 실행 에이전트 보고로 확인했다.

브라우저 셸 테스트는 제한 환경의 소켓 오류 후 `require_escalated` 실행 환경에서 서버와 Playwright를 실행하여 성공했다고 보고되었다. 정확한 당시 전체 셸 명령과 오류 원문은 작업 대화의 콘솔에 있으며 이 문서가 복원해 만들지 않는다. 결과는 Chromium 1 passed / 3.0s이고, `tests/e2e/shell.spec.ts`는 제목·한국어 lang·화음 수리점 제목 표시를 검사한다. Playwright 설정은 실패 때만 screenshot/trace를 남기므로 성공 화면 스크린샷을 확보했다고 주장하지 않는다. 후속 증거는 `handoffs/S00.md`에 계속 추가한다.
