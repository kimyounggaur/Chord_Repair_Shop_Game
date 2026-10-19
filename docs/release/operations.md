# 운영과 개발 인수인계

이 앱은 정적 React/Vite 웹앱이다. 자체 서버·계정·분석·마이크·동기화·결제·Service Worker가 없다. 학습 기록은 해당 origin/브라우저 프로필의 IndexedDB `chord-repair-shop`에 저장된다. 비공개 모드·브라우저 데이터 삭제·저장 공간 정책으로 없어질 수 있으므로 설정의 내보내기로 사용자가 파일을 보관한다. 도메인이 바뀌면 자동으로 이전 origin의 기록을 읽지 못한다.

## 재현 가능한 실행

```sh
npm ci
npm run dev                 # 127.0.0.1:5486, strict port
npm run check               # 경계/lint, 원본, 타입, 198개 도메인 검사, build
npx playwright install chromium firefox webkit
npm run test:e2e
npm run test:a11y
npm run build
npm run preview:qa          # 127.0.0.1:4486, 실제 배포 헤더/gzip
node scripts/production-qa.mjs
node scripts/soak.mjs       # 실제20분. 시간 단축 플래그 없음
```

정확한 설치 버전은 package-lock.json, 실행 환경은 ../toolchain.md 및 ../qa/device-matrix.md. Windows의 별도 Playwright 경로는 `PLAYWRIGHT_BROWSERS_PATH` 환경 변수로 지정한다. `npm run preview`도4486을 쓰므로 preview:qa와 동시에 켜지 않는다. 다른 게임의 포트·프로세스·파일은 바꾸지 않는다.

`node scripts/release-check.mjs --plan`은 읽기 전용 사전 확인이다. `--run`은 npm ci부터 모든 필수 검사를 순서대로 실행하고 고유한 docs/evidence/release 폴더에 로그·before/after source manifest·summary를 남긴다. 실행 중 src/tests/public/scripts/config를 편집하지 않는다. 실패·빈 suite·skip은 성공으로 취급하지 않는다. Windows WebKit native audio15개는 API 부재를 명시한 실행 범위 제외이며 지원 PASS가 아니다.

개발 E2E의 BASE_URL은 Vite 개발 서버용이다. 오디오 진단이 /src/app/runtime.tsx를 읽으므로 전체 개발 E2E를 production URL에 그대로 실행하지 않는다. production은 전용 production-qa/deployment-smoke 스크립트를 쓴다.

## 콘텐츠·아트·의존성 변경

원본 docs/design.md와 promptpack.md는 임의 수정하지 않는다. 요구가 바뀌면 변경 승인과 새 contentVersion·마이그레이션 설계를 먼저 기록한다. 8주문은 loader와 reference 검증 모두에 맞아야 build된다. 수리 목표를 바꾸면서 기존 독립 증거를 같은 의미로 재사용하지 않는다.

제공 아트의 source-manifest와 원본 ledger는 보존한다. 새 이미지/폰트를 사용하면 출처·사용 범위·hash·실제 사용 위치를 기록한다. runtime notices도 실제 번들에 맞게 갱신한다. exact 의존 버전을 바꾸면 audit·회귀·락파일·release manifest를 함께 다시 생성한다. .gitattributes는 원본/자산과 배포 해시의 byte 동일성을 위해 Git 줄바꿈 자동 변환을 끈다.

## 저장·복구

화면 상단의 저장 대기/진행/완료/실패를 구분한다. 저장 실패 시 작업은 메모리에 남고 내보내기를 제공하지만 탭을 닫은 뒤 보존을 보장하지 않는다. 완료 표시 전에 reload하지 않는 것이 좋다. 손상은 원본을 지우지 않고 이전 정상 backup 복구 또는 명시적 import를 선택한다. import는256KiB 상한, 엄격 schema, 확인 전 변경 없음, 확인 후 backup과 원자 교체다.

두 탭은 한 writer와 revision CAS를 사용한다. 읽기 전용 탭의 인수는 명시적으로 선택한다. lease가 만료되었다고 조용히 쓰기 권한을 훔치지 않는다. 문제가 생겨도 사용자의 실제 DB를 자동 초기화하지 않는다.

## 오류 재현과 오디오

기기/OS/브라우저 정확 버전, URL/releaseId, 주문·입력 방식·단계, 기대/실제 결과와 재현 순서만 먼저 기록한다. 실제 학습 파일은 사용자가 선택해 제공한 최소 범위만 다루며 공개 이슈에 개인정보·token·전체 기록을 올리지 않는다. production release.json에는 공개 가능한 코드/콘텐츠/락파일/자산 해시와 Git SHA만 들어간다.

소리는 명시적 제스처에서 켠다. 시스템 음량·브라우저 mute·출력 장치와 AudioContext 상태는 서로 다르다. 처음은 기기 음량을 낮게 설정한다. 잠금/앱 전환 후 자동 재생하지 않으며 다시 듣기를 선택한다. 실패 시 무음 구조 학습을 계속할 수 있다. 미리듣기는 짧게 종료되고 수정/스크롤/이동하면 이전 generation을 취소한다. 매우 빠른 탭이 취소되면 현재 화음 듣기로 비교할 수 있다.

새 배포는 사용자가 지정한 저장소/별도 Vercel 프로젝트 범위에서만 한다. 신규 자격증명·권한 확대·유료 자원·DNS·분석·모니터링은 이 인수인계에 의해 승인되지 않는다.
