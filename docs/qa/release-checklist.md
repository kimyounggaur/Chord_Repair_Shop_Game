# S11/S14 재현 검증 준비표

이 문서는 초기 준비 당시의 점검 목록을 보존한 이력이다. 현재 설정·실행 결과는 [test-report.md](test-report.md), [performance.md](performance.md), [security-review.md](security-review.md), [출시 후보](../release/release-candidate.md)를 우선한다. 세 엔진 설정·vercel.json·build-generated release.json은 이후 실제 구현되었다. 아래의 '예정/아직 없음'은 현재 기능 상태가 아니다.

작성일: 2026-10-19. **실행 준비물이며 S11/S14 통과표가 아니다.** 기준은 `../design.md` 17–19, 20.9, 21, 24장과 `../promptpack.md` S11/S13/S14 및 부록 D/E다. 작성 당시 S00–S03은 PASS, S04는 진행 중이다. 이후 실제 실행 결과는 각 단계 인계와 QA 보고서에 남긴다.

## 현재 설정에서 먼저 닫을 빈틈

| 관찰된 상태 | 다음 담당자의 구체적인 조치 | 통과 근거 |
|---|---|---|
| Vitest 수집은 `tests/{unit,integration,audio}/**/*.test.{ts,tsx}`로 root가 수정했다. `.tsx`를 포함하는 수정 전에는 통합 화면 검사가 제외될 수 있었다. | 최종 test:integration 로그에서 실제 화면 테스트 이름/개수가 수집되는지 확인한다. 파일 존재만으로 검사 완료 처리하지 않는다. | 테스트 목록과 실행 로그, DOM 환경 오류가 없는 실제 assertion 결과 |
| Playwright 프로젝트는 작성 당시 Chromium 하나였다. workspace에 브라우저 바이너리가 설치되었다는 보고가 있지만 설정과 실행은 별도다. | S09/S11에서 Chromium/Firefox/WebKit 프로젝트를 설정하고 각각 실행한다. 정확한 엔진 버전을 남긴다. | 세 엔진 결과와 실패 trace. WebKit은 실제 iOS Safari로 표시하지 않음 |
| Playwright `testMatch`는 `**/*.spec.ts`, `test:a11y`는 `tests/accessibility`를 지정한다. | 해당 위치에 실제 수집되는 spec을 만들거나 담당자가 명령/설정을 맞춘다. 원문 예시의 `.test.tsx`는 이 Playwright 설정에 자동 포함되지 않는다. | `test:a11y`에 실제 테스트 수와 핵심 행동·axe 결과. no-tests는 실패 |
| `check`는 Playwright E2E/접근성을 포함하지 않는다. | 최종 회귀는 아래 개별 명령 전체를 사용한다. | unit만 통과한 check를 전체 회귀라고 보고하지 않음 |
| 기존 `scripts/audit-build.mjs`는 정적 빌드 바이트 검사다. | 실제 production 최초 작업대까지 전송량을 별도 HAR/PerformanceResourceTiming으로 측정한다. | 폰트·이미지 포함 1.5MB 결과, cache/압축/서비스워커 조건과 리소스 목록 |
| 작성 당시 `vercel.json`은 없었으며 root 소유로 추후 작성 예정이다. | 최종 same-origin CSP/권한 정책을 코드 검토하고 실제 배포 응답을 검사한다. 이 문서는 hosting 설정을 변경하지 않는다. | 설정 파일 + 실제 응답 헤더 + CSP 하에서 앱 동작 |
| 제한 환경에서 서버/브라우저 소켓 오류가 있었고 S00은 허용된 실행 환경에서 성공했다. | 같은 실행 조건과 `PLAYWRIGHT_BROWSERS_PATH`를 기록한다. 환경 실패를 기능 PASS로 바꾸지 않는다. | 실행 명령/환경/exit code. 재승인·권한 확장 없이 필요한 기존 경로만 사용 |

## 1. 로컬 자동 회귀와 artifact 고정

다른 담당자의 파일 편집과 dependency 설치가 끝난 뒤 실행한다. 개발 서버 포트는 5486, production preview는 4486이다. 기존 5486 서버가 다른 checkout/build를 제공하지 않는지 확인한다. 이 helper는 `package.json`을 고치거나 배포하지 않는다.

```powershell
node scripts/release-check.mjs --plan
node scripts/release-check.mjs --run
```

`--plan`은 파일/명령을 읽고 출력만 한다. `--run`은 필수 script나 test 그룹에 파일이 없으면 설치 전에 BLOCKED로 끝낸다. 파일이 있어도 실제 수집/성공을 보장하지 않으므로 다음 고정 순서를 실행한다: `npm ci` → `verify:reference` → `test:content` → `typecheck` → `lint` → `test:unit` → `test:integration` → `test:audio` → `test:e2e` → `test:a11y` → `build`. 첫 실패/빈 테스트/skip 보고에서 중지하고 뒤 검사는 NOT RUN으로 남긴다. 이 순서는 `npm run check` 하나로 대체하지 않는다.

로그는 매번 새 `docs/evidence/release/<UTC>-<random>/`에 저장된다. `plan.json`, 각 명령 `.log`, `source-manifest-before.json`, `source-manifest-after.json`, `summary.json`을 보관한다. 빌드까지 성공하면 `artifact-manifest.json`에 dist 파일별 SHA-256과 바이트, 전체 manifest 해시를 남긴다. 원본·fixture·lockfile·src/public/tests/scripts/config 또는 Git HEAD가 실행 중 달라지면 실패 처리한다. `git commit`이 없으면 commit은 null이며 이를 배포 SHA로 사용하지 않는다.

`AUTOMATED_CHECKS_PASS`는 해당 실행 명령과 정적 예산의 결과일 뿐 출시 READY가 아니다. helper의 `releaseReadiness`는 항상 NOT_ASSESSED다. 자동 로그에 SKIP이 없더라도 요구별 assertion 누락·mock로 실제 기능을 대신한 사례·정답 버튼/fixture ID 치팅은 독립 코드 검토가 필요하다.

helper 자체는 `node scripts/release-check-selftest.mjs`로 임시 디렉터리의 합성 command fixture만 실행해 점검할 수 있다. 2026-10-19에 plan 무쓰기, 빈 그룹 사전 차단, 성공 수집, child 실패 중단, skipped 거부, 실행 중 source 변경 거부의 6개 시나리오가 exit 0으로 확인되었다. 이 self-test는 실제 npm ci/앱 테스트/브라우저/네트워크/배포를 실행하지 않았으며 S11/S14 증거로 세지 않는다. 결과는 콘솔 전용이다.

정적 예산은 모든 빌드 JS의 gzip 합계 ≤250,000바이트(초기 JS의 보수적 상한), non-HTML/JS/CSS/map 자산 ≤5,000,000바이트다. 이것은 1.5MB **초기 실제 전송량**·메모리·출력 지연 측정이 아니다. `audit-build.mjs`의 이미지/폰트 분류와 helper의 비코드 전체 자산 분류가 다르면 누락 파일을 확인하고 실제 전체 MVP 자산 목록을 확정한다.

- [ ] 모든 8 target은 correct, 모든 initial은 incorrect; 6순열·중복음·철자·음역·전위·invalid/incomplete 분리 검사.
- [ ] 부록 D MUS/DATA/STATE/LEARN/INPUT/AUDIO/STORE/ENS/SANDBOX/A11Y/PERF/SEC/OFFLINE 각 ID에 실행/수동 검사와 증거 연결.
- [ ] 설계 17.3의 실패 시나리오 12개를 실제 사용자 흐름으로 검사. 기능 자체를 mock한 검사는 E2E로 집계하지 않음.
- [ ] build 원본·fixture·contentVersion·lockfile·asset ledger hash를 동일 후보에 묶기. 변경 후 관련 회귀와 artifact manifest 재생성.
- [ ] dependency-ledger의 선언 license 외에 실제 자산 출처/권리·dependency 취약점 영향과 대응을 기록. `npm audit` 결과는 영향 분석 없이 무조건 major upgrade하는 근거가 아님.

## 2. production 브라우저·저장·성능 게이트

최종 build 후 별도 터미널에서 `npm run preview`(4486)를 실행하고, 실제 production URL을 대상으로 E2E를 재실행한다. 기존 dev 서버 결과를 production 증거로 재사용하지 않는다.

```powershell
$previousChordBaseUrl = $env:BASE_URL
try {
  $env:BASE_URL = 'http://127.0.0.1:4486'
  npm run test:e2e
  npm run test:a11y
} finally {
  if ($null -eq $previousChordBaseUrl) {
    Remove-Item Env:BASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:BASE_URL = $previousChordBaseUrl
  }
}
```

위 환경 변수 설정/복원은 실행 예시다. 각 npm 명령 직후 exit code와 로그를 별도로 기록한다. 브라우저 설정이 BASE_URL을 받으면 webServer를 만들지 않으므로 먼저 preview가 실제 응답하는지 확인한다.

| 검사 | 필요한 실제 절차와 수용 조건 | 기록 위치/상태 |
|---|---|---|
| 3 엔진/입력/레이아웃 | Chromium/Firefox/WebKit 각각 390×844, 320px, 가로, touch, 키보드, 200%/400% 확대. 본문 overflow 0, 피아노 내부 가로 영역은 별도. | `device-matrix.md`, `accessibility.md`; NOT RUN |
| 저장 장애 | 실제 IDB quota/거부/손상/구·미래 버전/두 탭/reload/contentVersion 차이. 기존 저장 무단 삭제 없이 복구 및 export. | `test-report.md`, STORE01–15; NOT RUN |
| 처음 로드 뒤 offline | 작업대까지 load → 연결 차단 → 수정/제출/질문/저장/합주. 이미 로드한 세션만 보장하며 offline 재실행은 약속하지 않음. | OFFLINE01 trace; NOT RUN |
| 최초 전송 | 깨끗한 브라우저 context/cache, production, 작업대까지의 모든 요청 포함. 1,500,000바이트 이하 목표. network bytes와 decoded bytes를 혼동하지 않음. | HAR/리소스 표, 계측 조건; NOT RUN |
| 첫 의미 있는 화면 | 고정 중급 기기와 명시된 제한망에서 ≤2.5초 목표. FCP만으로 의미 있는 작업대 표시를 대체하지 않음. | 표본 수/워밍업/기기/망/측정 정의; NOT RUN |
| 반응 지연 | tap→다음 paint p95≤100ms, tap→audio 예약 p95≤30ms. main-thread 예약 지표는 스피커 지연이 아님. | 표본 배열/계측 코드/방법; NOT RUN |
| 20분 누수 | 수정·비교·주문 전환·합주·stop 반복. 시계열 heap/voice/listener/timer 표본, voice≤24 및 stop 후 정리. 한 번의 heap 값으로 누수 없음 주장 금지. | PERF05 시계열/trace; NOT RUN |
| 보안/권리 | 로컬 import≤256KB 및 배열/프로토타입 키 검증, 외부 HTML/script/JSON 실행 0, analytics/account/마이크/카메라/위치 0. 로그에 학습 기록·비밀 전송 0. | `security-review.md`, network 기록, asset/dependency ledger; NOT RUN |

## 3. 실제 사람이 확인해야 하는 열린 게이트

아래는 자동 Chromium/WebKit이나 OfflineAudioContext로 대체하지 않는다. 미확보이면 NOT RUN과 사유를 유지한다. 원문 24장의 필수 실기기/관찰 게이트가 남아 있으면 **개발 후보, 출시 준비 미완료**로 보고한다. 사용자가 승인한 배포를 진행하더라도 개발 미리보기와 검증된 정식 출시는 구분한다.

- [ ] 실제 기기 모델/정확 OS/브라우저 버전/검사자/날짜/후보 releaseId, 내장·유선·Bluetooth 출력별 기록.
- [ ] iOS Safari 최신 및 지원할 직전 주요 버전, Android Chrome, 실제 desktop Safari/Chrome/Firefox 중 검증한 조합만 지원표에 기재.
- [ ] 첫 unlock, 10연타, 비교 중 수정/뒤로, 잠금, 앱 전환 30초, 전화/미디어 중단, 출력 장치 변경, 저전력, browser mute/system volume 0/closed context. 복귀 자동 소리·stale 큐·지속음·과다 음량 없음.
- [ ] 사람이 C/Cm·F/Fm·G/Gm의 전후 세 음 존재/변화를 실제 청취. 엔진 신호 분석과 청취, 참가자의 장단 식별 능력은 각각 별도 결과.
- [ ] 내장/유선 tap→실제 스피커 p95≤100ms 목표는 외부 계측으로 측정; 측정하지 않았으면 “미측정”. Bluetooth 수치는 별도.
- [ ] VoiceOver/TalkBack으로 8수리·결과·설정·export, 시스템 큰 글자/reduced motion. axe 통과를 AT 수동 통과나 AA 적합 선언으로 바꾸지 않음.
- [ ] S12 실제 사용성 관찰 수행 여부와 독립 전이 검사 상태. 참가자 모집/연락/녹화·후속 연락은 이 체크리스트로 승인되지 않음. 계획만 만든 경우 결과·효과 수치는 공란.

## 4. S14: 정확한 배포와 공개 URL 확인

사용자는 `kimyounggaur/Chord_Repair_Shop_Game` commit/push 및 별도 Vercel 프로젝트 배포를 승인했다. 원격 이력·사용자 변경 보존, force push 금지, 기존 인증 사용, 신규 credential/권한 확장/유료 결제 금지는 계속 적용한다. 이 문서/helper는 push/deploy를 실행하지 않는다.

| 게이트 | 남길 구체적인 증거 | 상태 |
|---|---|---|
| 공개 대상/범위 | 기존 대화 승인, 실제 Vercel account/team/project ID와 프로젝트 이름, 다른 게임과 별도임을 확인. 비용/약관/도메인 변경 유무. | NOT RUN |
| Git 후보 | 최종 `git rev-parse HEAD` 전체 SHA, `git status` 사용자 변경 검토, push 대상 branch, GitHub 원격에서 같은 전체 SHA 확인. 짧은 SHA만 쓰지 않음. | NOT RUN |
| artifact 결속 | 위 SHA의 source/lock/contentVersion/asset ledger/build manifest 해시. 배포 후 코드가 바뀌었다면 이전 검사와 새 배포를 같은 후보로 보고하지 않음. | NOT RUN |
| Vercel 결과 | 실제 deployment ID, project ID, 생성 시각, READY, provider에 기록된 git commit SHA. CLI upload라 git SHA 자동 메타데이터가 없으면 그 사실과 업로드 artifact hash로 결속하고 SHA 검증 완료를 꾸미지 않음. | NOT RUN |
| 공개 접근 | 인증 쿠키/보호 우회 없이 실제 production alias와 immutable deployment URL 응답. 최종 리디렉트 URL, HTTP status, HTTPS, HTML MIME 기록. 보호 화면/로그인 응답은 공개 접근 성공이 아님. | NOT RUN |
| 배포 bytes/콘텐츠 | 후보 manifest의 JS/CSS/이미지 실제 URL을 fetch해 decoded response body SHA-256 비교. contentVersion·CR01–08 확인. 압축 전후 바이트 차이를 해시 불일치로 혼동하지 않음. | NOT RUN |
| 실제 동작 | 운영 URL 최초 load/assets, CR01 무음 수리·관계 질문, 제스처 오디오, 8주문, route 새로고침, 저장 복원, 모바일 layout. 허용되지 않은 autoplay가 없는지 확인. | NOT RUN |
| cache/route/MIME | 실제 응답 기준으로 HTML 업데이트 재검증, hashed asset cache, JS/CSS/WebP MIME와 base path/SPA route fallback. 설정 파일 존재만으로 통과 처리하지 않음. | NOT RUN |
| 되돌리기 | 이전 정상 배포 유무, 되돌릴 deployment ID, 현재 저장 schema와 호환성·export·회귀 순서. 최초 배포라 이전 버전이 없으면 그 사실을 기록. 실제 rollback을 하지 않았다면 절차 준비로 표시. | NOT RUN |

### S13에서 구현할 build-generated release.json 제안

아직 구현하지 않은 root 담당 작업이다. UI/도메인을 바꾸지 않고 build 후 `dist/release.json`을 생성하여 운영 URL의 실제 artifact 신원을 직접 확인할 수 있게 한다. 매 build마다 source의 `public/release.json`을 고쳐 source 안정성 검사를 깨는 방식은 피한다.

1. commit은 `VERCEL_GIT_COMMIT_SHA`가 있으면 그 전체 SHA를 사용하고, 로컬 build에서는 `git rev-parse HEAD`를 fallback으로 사용한다. 값이 없으면 unknown을 명시하고 배포 SHA 확인 완료로 표시하지 않는다. provider metadata/GitHub 원격 SHA와 별도로 대조한다.
2. `releaseId`, 전체 `gitSha`, `appVersion`, `contentVersion`, `sourceManifestSha256`, `lockfileSha256`, `assetManifestSha256`, build 시각처럼 공개해도 되는 정보만 기록한다. 환경 변수 전체나 계정/token/로컬 사용자 경로를 넣지 않는다.
3. 순환 해시를 만들지 않는다. build runtime 파일의 canonical manifest를 계산할 때 `release.json`과 공개 `artifact-manifest.json` 자체는 명시적으로 제외한다. manifest의 경로 정렬·바이트·SHA-256 형식과 제외 목록을 문서화하고, 그 manifest hash를 `release.json`에 넣는다.
4. 공개 manifest와 release metadata를 생성한 후, **배포물 밖의 증거용** manifest에는 두 metadata 파일의 실제 hash까지 포함해 최종 업로드 바이트를 기록한다. 이 외부 증거는 dist에 다시 넣지 않는다. 기존 helper의 `artifact-manifest.json`은 `docs/evidence/`에 생기므로 이 용도로 사용할 수 있다.
5. S14에서 인증 없는 `GET /release.json`과 공개 manifest를 읽어 후보의 전체 SHA/contentVersion/세 source·lock·asset hash/manifest hash를 대조하고, 필요한 runtime 파일의 decoded body hash도 비교한다. READY 응답만으로 이 검사를 대신하지 않는다.

이 기능이 준비되기 전에는 단순히 URL이 열리는 것을 정확한 SHA의 배포 확인으로 보고하지 않는다.

### 보안 헤더의 확정 기대와 남은 선택

root가 정한 기대는 **same-origin script/font/img/connect CSP**, 마이크·카메라·위치 비허용이다. 실제 `vercel.json`은 root가 작성한다. 아직 CSP 문자열을 확정하지 않았으므로 이 문서는 임의의 exact-string 헤더 테스트를 만들지 않았다.

- [ ] `Content-Security-Policy`: script/font/img/connect의 허용 origin을 실제 리소스 요청과 대조한다. `script-src`의 `unsafe-inline`/`unsafe-eval`/불필요한 외부 origin을 추가해서 오류를 숨기지 않는다. CSS inline 요구 및 data/blob 예외가 필요하면 목적과 최소 범위를 명시한다.
- [ ] `Permissions-Policy`: `microphone=()`, `camera=()`, `geolocation=()`를 실제 HTML 응답에서 확인한다. 다른 권한을 임의 확장하지 않는다.
- [ ] `X-Content-Type-Options: nosniff`, referrer 최소화 정책, framing 차단 정책의 최종 값은 root의 배포 설정 리뷰에서 확정한다. 원문에 없는 exact 값을 통과 기준으로 몰래 추가하지 않는다.
- [ ] 실제 CSP 아래 load·import/export·Web Audio·이미지·새로고침이 작동하며 browser console/network에 blocked 필수 리소스가 없다. 헤더 누락과 앱 동작 실패를 각각 기록한다.
- [ ] 인증 없는 GET의 필요한 응답 헤더만 증거로 저장한다. cookies/authorization/token은 QA 문서나 저장소에 기록하지 않는다.

마지막 보고에는 **실제 commit 전체 SHA, deployment READY 근거, 운영 URL, 실행 검사와 미실행 실기기/청취/연구 항목, 남은 출시 차단**을 함께 적는다. 성공 URL·READY·사용량 초기화·롤백 성공은 추측하지 않는다.
