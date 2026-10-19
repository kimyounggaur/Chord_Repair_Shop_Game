# 화음 수리점

세 개의 음을 직접 바꾸며 장·단3화음의 관계를 탐색하는 한국어 모바일 웹 게임입니다. C/Cm/F/Fm/G/Gm, 원본 8개 주문, 기기 내 저장, 자유 실험과 8마디 합주를 구현한 독립 프로젝트입니다.

현재 **개발 후보, 출시 준비 미완료**입니다. 실행한 검사와 실기기·청취·AT·사용자 관찰의 미완료 항목은 [QA 보고](docs/qa/test-report.md)와 [출시 후보 판단](docs/release/release-candidate.md)을 확인하세요.

## 실행

Node 24.14 이상과 npm을 사용합니다. 정확한 의존 버전은 `package-lock.json`에 고정되어 있습니다.

```sh
npm ci
npm run dev       # 127.0.0.1:5486
npm run check     # 도메인 경계, 원본 대조, 타입, 단위/통합/오디오, 빌드
npm run test:e2e
npm run test:a11y
npm run build
npm run preview   # 127.0.0.1:4486
npm run preview:qa # 같은4486, 배포용 헤더와 gzip. preview와 동시에 실행하지 않음
node scripts/release-check.mjs --plan
node scripts/release-check.mjs --run # clean install부터 전체 검사, 고유 증거 폴더 생성
```

브라우저 테스트는 `npx playwright install chromium firefox webkit`으로 테스트 엔진을 설치한 뒤 실행합니다. 별도 브라우저 설치 경로를 사용하면 `PLAYWRIGHT_BROWSERS_PATH`를 지정합니다. `BASE_URL`은 이미 실행 중인 Vite 개발 서버에만 사용합니다. production 검사는 `scripts/production-qa.mjs`와 `scripts/deployment-smoke.mjs`로 구분합니다. Windows Playwright WebKit의 native 오디오 API 부재는 명시적 미실행이며 실제 Safari 결과가 아닙니다.

## 기준과 검증

- `docs/design.md`, `docs/promptpack.md`: 사용자 원본을 바이트 그대로 보존한 구현 기준
- `docs/implementation-status.md`: 단계별 실제 실행 상태
- `docs/handoffs/`: 단계별 명령과 검증, 미실행 범위
- `docs/requirements-audit.md`: 음악·상태·오디오·저장 계약 검토
- `docs/toolchain.md`: 설치 환경, 원본 해시, 버전
- [요구사항 추적표](docs/requirements-traceability.md): REQ01–28, 부록D, 실패 시나리오12개와 실제 검사 연결
- [운영](docs/release/operations.md), [알려진 한계](docs/release/known-issues.md), [되돌리기](docs/release/rollback.md)
- [연구 준비](docs/research/usability-protocol.md): 계획·빈 양식·정답 검산. 실제 참가자 결과 없음

브라우저 자동화는 실제 iPhone/Android의 터치·전화 중단·Bluetooth·스피커 청취 및 VoiceOver/TalkBack 검증을 대신하지 않습니다. 게임 완료율을 음악 능력이나 교육효과의 검증으로 해석하지 않습니다. 정확한 검증 상태와 알려진 한계는 단계별 기록을 따릅니다.

이 프로젝트는 다른 게임의 코드·저장 영역과 분리되어 있습니다. 로그인, 마이크, 광고, 분석 전송, 결제, Service Worker는 사용하지 않습니다. 진행 기록은 해당 브라우저에 저장되며 영구 보관이나 기기 간 동기화를 보장하지 않습니다.
