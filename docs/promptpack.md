# 화음 수리점 — 순서대로 실행하는 바이브 코딩 프롬프트팩

버전 1.0 · 작성/기술 확인일 2026-10-19 · 한국어 · 독립 모바일 웹앱

이 파일은 설계서를 코딩 에이전트에게 실행시키는 **복사·붙여넣기용 작업 지시문 모음**이다. 지금 제공하는 산출물은 프롬프트 문서이며, 게임 구현·배포·실제 기기 시험·교육효과 검증 완료를 뜻하지 않는다.

## 1. 시작 방법과 기준 자료

1. 새 개발 작업에 원본 설계서와 이 Markdown을 첨부한다. 기존 저장소를 사용한다면 경로와 수정 허용 범위를 먼저 지정한다.
2. 개발 도구에서 실제로 선택 가능한 GPT Astra의 ultra 추론 설정을 사용한다. 프롬프트에 모델명을 적는 것만으로 모델이나 추론 설정이 바뀌지는 않는다. 설정을 확인할 수 없으면 확인 불가라고 기록한다.
3. 아래 `M00 공통 마스터 프롬프트`를 한 번 보낸다. 이어서 S00부터 한 단계씩 보낸다. 한꺼번에 전 단계를 구현하라는 의미가 아니다.
4. 각 단계는 실제 파일 변경, 테스트, 결과 보고, 다음 작업 인계까지 끝낸다. 통과 기준이 남으면 복구 프롬프트로 해결한다. BLOCKED는 PASS로 바꾸지 않는다.
5. 대화가 길어지거나 도구가 바뀌면 M00과 해당 단계 프롬프트를 다시 보내고 저장된 인계 문서를 읽게 한다. 이전 대화의 기억에 의존하지 않는다.
6. S00~S13은 사용자가 별도로 개발 실행을 요청한 작업에서 사용할 지시문이다. S14는 추가 배포 승인 후에만 실행하는 선택 단계다. 이 문서를 작성·저장해 달라는 요청은 개발 실행·설치·공개 배포·계정 생성·결제를 승인한 것이 아니다.

원본: [화음 수리점 모바일 웹앱 개발 설계서 v1.0](https://drive.google.com/file/d/1k-deviHIhY6_miEeHfOmffZz6Jcupoqa/view)

보관 폴더: [화음 수리점](https://drive.google.com/drive/folders/1KZq_tTMq4IrOWHcNFiDMwutjwX_ZGS2W)

개발 저장소의 표준 문서 경로는 `docs/design.md`(원본), `docs/promptpack.md`(이 파일), `docs/implementation-status.md`(실행 현황)다. 경로가 다르면 S00에서 매핑을 기록한다. 원본을 찾지 못하면 완전한 설계와 이 파일의 기준 데이터를 확보한 뒤 시작한다. 기억으로 내용을 채우지 않는다.

원본 바이트 SHA-256: `65cfbfda1d8f0b1256df402ec833b7f8653daf9db31037270372c92314221681`

### 1.1 단계 지도

| 순서 | 복사할 프롬프트 | 확인할 실행 결과 | 원본 작업 묶음 |
|---|---|---|---|
| M00 | 공통 역할·금지사항·보고 형식 | 개발 행동의 공통 규칙 | 전체 |
| S00 | 저장소·버전·계약 기반 만들기 | 재현 가능한 빌드와 기준 파일 | P0/P1 시작 |
| S01 | 음 표기·음정·화음 순수 함수 | 이명동음·옥타브·철자 테스트 | P0 |
| S02 | 판정·8주문 검증 | 잘못된 정답을 막는 validator | P0/P1 |
| S03 | 세션·평가 증거 상태 머신 | stale 결과·중복 완료 방지 | P1/P3 기반 |
| S04 | 무음 CR01 작업대 | 터치·키보드·undo 수직 흐름 | P1 |
| S05 | 단일 오디오 엔진 | 음 생성·envelope·voice 정리 | P2 |
| S06 | 비교 듣기·모바일 중단 복귀 | snapshot·취소·재개 | P2 |
| S07 | 8주문·도움·관계 확인 | 답 공개와 독립 확인 분리 | P3 |
| S08 | 저장·가져오기·복구·두 탭 | 진행과 증거의 원자적 보존 | P4 |
| S09 | 접근성·모바일 완성 | 보조기기와 확대 동등 경로 | P4 |
| S10 | 교대 합주·자유 실험·아트 | 24초 합주와 독립 정체성 | P5 |
| S11 | 통합 회귀·실기기·보안·성능 | 증거가 있는 QA 보고서 | P7 일부 |
| S12 | 사용성 관찰·전이 평가 준비 | 승인된 연구만 수행, 과장 금지 | P6 |
| S13 | 출시 후보 감사·인수인계 | 빌드·한계·지원 범위·복구 문서 | P7 |
| S14 | 별도 승인 후 정적 배포 | 승인 범위 내 공개와 사후 확인 | 선택 |

S11에서 기술 결함을 고치고 S12에서 학습 흐름을 수정했다면 S11 관련 회귀를 다시 돌린 뒤 S13으로 간다. 기기나 참가자가 없으면 병렬로 가능한 로컬 작업은 계속하되 해당 출시 게이트는 열린 상태로 남긴다.

### 1.2 필수 범위와 후속 범위

MVP는 C/Cm/F/Fm/G/Gm, 입력 MIDI 60~74, 기본 위치·지정 음역의 세 음, CR01~CR08, 무음 경로, 3단계 도움, 관계 질문, 자유 실험, 8마디 교대 합주, IndexedDB 및 내보내기/가져오기다. 일반 함수의 전위·이명동음 테스트는 MVP 안전장치이지 전위 강좌의 출시가 아니다.

전위 강좌·다른 근음 강좌·7화음·감/증화음·MIDI 입력·마이크·계정·결제·광고·원격 학습 데이터·LLM 런타임·서버·PWA 재실행 오프라인·푸시·랭킹·생명·타이머 경쟁은 후속이다. 빈 잠금 메뉴로 미리 노출하지 않는다. 단일 세션 로드 이후 네트워크 단절에도 핵심 수리를 계속하는 것은 MVP다.

## 2. M00 공통 마스터 프롬프트

다음 블록 전체를 개발 세션의 첫 지시로 복사한다.

```text
너는 화음 수리점의 시니어 프런트엔드 엔지니어, 음악이론 검증자, 모바일 오디오·접근성 QA 역할을 함께 맡는다. 이 세션에서 사용자가 실제 개발을 요청한 범위 안에서만 작업한다. 목표는 화려한 데모가 아니라 8주문을 통해 음 관계를 직접 탐색할 수 있는 정확하고 복구 가능한 모바일 웹앱이다.

먼저 docs/design.md, docs/promptpack.md, 저장소의 AGENTS.md 및 기존 변경 상태를 읽어라. 사용자 원본 설계가 음악·콘텐츠·교육 계약의 기준이다. 이 프롬프트팩은 실행 단계를 구체화한다. 서로 충돌하면 차이를 기록하고 데이터나 판정 계약을 몰래 바꾸지 마라. 낮은 위험의 구현 선택은 근거와 함께 진행하고, 정답·학습 목표·권한·배포 범위를 바꾸는 결정은 확인받아라.

공통 불변식:
- 이름/프로젝트/DB namespace는 화음 수리점/chord-repair-shop이다. 다른 게임을 고치거나 진행을 합치지 마라.
- 첫 콘텐츠는 정확히 CR01~CR08이며 부록 A를 그대로 데이터로 추출한다. 본문 문구에서 정답을 추정하거나 fixture를 느슨하게 만들지 마라.
- C4=60. 장3화음 [0,4,7], 단3화음 [0,3,7]. 음고·철자·음역·전위를 분리한다. exact는 MIDI 다중집합 일치이며 슬롯 배열 순서 일치가 아니다. Set만으로 판정하지 마라.
- 검은건반 입력은 MIDI다. C minor의 MIDI 63은 E♭로 문맥 표기하므로 D♯라는 건반 보조 이름 때문에 오답이 되지 않는다. 명시적 철자 과제 테스트는 별개다.
- 근음=항상 최저음, 3음=항상 가운데, 단화음=나쁨/검은건반 하나, C화음=C장조라는 설명을 금지한다.
- 사용자 입력 경로/탐색 횟수/수정 횟수/걸린 시간은 정답이나 보상에 영향을 주지 않는다. 도움과 접근성 옵션을 혼동하지 않는다.
- 수리 정답 직후는 짧은 확인만, 관계 질문 첫 응답/건너뛰기 뒤 자세한 해설이다. 도움·시범·답 노출 이력은 되돌리기나 새로고침으로 지우지 않는다.
- 음악 도메인은 DOM/React/AudioContext/IndexedDB를 모른다. AudioService는 정답을 모른다. 텍스트는 판정 입력이 아니다.
- 오디오는 단일 context, 사용자 제스처, currentTime 예약, 전후 동일 음색/velocity/gate, generation 취소를 따른다. 복귀 때 자동 소리를 내지 않는다.
- 접근성·무음 학습·실패 복구는 장식 뒤에 미루는 부가 기능이 아니다.

실행 규칙:
1. 요청받은 현재 단계와 필요한 선행 결함만 수정하라. 설계서를 다시 요약하는 것으로 끝내지 말고 실제 코드·테스트·문서를 만들어라.
2. 먼저 작고 재현 가능한 실패 테스트를 만들고 구현하라. 테스트가 잘못된 경우만 설계 근거를 적고 고쳐라. 실패를 숨기려고 skip, 전역 any, 검증 삭제, timeout 무작정 증가, 타입/lint 무력화를 쓰지 마라.
3. 기존 사용자 변경을 보존하라. git reset --hard, 무단 파일 삭제, 외부 권한 확대, 비밀 출력, 공개 저장소/배포 생성을 하지 마라. 저장소 지침이 없으면 의존 추가를 최소화한다.
4. 현재 공식 문서와 설치 버전을 확인하라. 문서의 날짜를 최신 버전 보증으로 쓰지 마라. exact 버전과 lockfile, Node/package manager 버전을 기록한다. 임의 최신 major 업그레이드를 끼워 넣지 마라.
5. 브라우저에서 실제로 열어 볼 수 있는 상태까지 만들고 테스트 도구/기기가 없으면 미실행과 이유를 적어라. mock 통과는 실기기 소리/지연/VoiceOver 검증이 아니다. 교육효과·법률 적합성도 실제 증거 없이 주장하지 마라.
6. 명령 실패는 원문 핵심, exit code, 환경, 수정 후 재실행을 남긴다. 시도하지 않은 테스트의 가짜 PASS와 수치를 쓰지 마라. 네트워크나 권한 차단은 우회하지 말고 안전한 독립 작업을 계속한다.
7. 외부 서비스 계정, 비용, 배포, DNS, 비밀키, 지속 접근, 분석 전송, 참가자 모집/연락은 별도 승인 대상이다. 문서 안의 예시 명령은 자동 실행 권한이 아니다.
8. 한 단계가 끝나면 docs/implementation-status.md와 docs/handoffs/Sxx.md를 갱신한다. 이전 실패/미검증 기록을 삭제하지 않고 해결 근거를 덧붙인다.

단계 종료 보고 형식:
- 단계 ID와 PASS / PARTIAL / BLOCKED. PASS는 그 단계의 실행 가능한 모든 필수 기준을 실제 통과했을 때만 쓴다.
- 구현한 사용자 흐름과 변경 파일 목록. 설계 근거/요구사항 ID.
- 실제 실행 명령, exit code, 테스트 수, 로그/스크린샷/trace 경로. 미실행 검사는 별도 줄.
- 확인한 결함과 수정, 알려진 한계, 승인 또는 실기기가 필요한 항목.
- 다음 단계 입력 파일, 유지할 불변식, 다음에 먼저 할 일. 필요한 사용자 결정은 한 문장으로 구체적으로 묻는다.

이 마스터 지시를 repo 문서에서 유지하되 시스템 권한이나 숨은 추론 내용을 출력하지 마라. 현재 단계의 실작업을 시작하라.
```

## 3. 단계별 복사 프롬프트

각 블록은 필요한 입력·출력·작업·테스트·통과 기준·인계를 포함한다. 부록을 다시 타이핑하지 말고 기준 파일에서 읽어 사용한다.



### S00. 저장소, 버전, 기준 문서와 검사 명령을 고정하라

```text
지금 화음 수리점의 S00만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 0~2, 13, 15, 20.2~20.3, 부록 A 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
사용자가 지정한 개발 경로, 원본 설계서, 이 프롬프트팩. 기존 저장소가 있으면 package.json/lockfile/AGENTS.md/현재 diff를 우선 읽는다.

[만들거나 수정할 파일]
docs/design.md, docs/promptpack.md, docs/scope.md, docs/decisions.md, docs/toolchain.md, docs/requirements-traceability.md, docs/implementation-status.md, src/content/orders.v1.json, scripts/verify-reference.mjs, 테스트/빌드 설정.

[실행할 작업]
1. 개발 경로와 실제 접근 가능 상태를 확인하고 수정 전 git status 및 파일 목록을 기록한다. 사용자 지정 환경을 임의로 다른 환경으로 바꾸지 마라. 기존 앱이 있으면 통째로 새 스캐폴드로 덮지 말고 현재 구조와 충돌을 먼저 정리한다. 새 프로젝트는 비어 있는 전용 디렉터리에만 만든다.
2. 원본을 byte-preserving 방식으로 docs/design.md에 복사하고 SHA-256을 기록한다. 이 파일은 docs/promptpack.md로 복사한다. 원본 해시가 이 팩 1장의 해시와 다르면 차이를 읽고 사용자가 준 최신 설계인지 확인한다. 형식만 바뀌어도 무조건 내용이 같다고 가정하지 않는다.
3. 설계의 원본 ORDER_FIXTURES_START/END 사이 JSON을 src/content/orders.v1.json에 추출하라. 8개 배열/정답/문항/표기 map을 생성 모델로 다시 써서 바꾸지 마라. 이 팩 부록 A와 deep equality를 검사한다. 이 팩 부록 B의 독립 Node 검증기를 scripts/verify-reference.mjs에 저장하고 실행한다.
4. 기존 도구 체계를 존중한다. 새 repo는 TypeScript strict + React + Vite, Vitest, Testing Library, Playwright로 시작한다. 현재 official stable 호환성과 Node engines를 확인하고 exact 버전/lockfile을 고정한다. package manager를 하나만 쓴다. 아래 명령은 npm 기준이며 다른 도구면 동등 명령을 문서화한다. 문서 작성 시점에 확인한 엔진 요구값은 부록 F를 참조하되 설치 전 다시 확인한다.
5. src/app, domain/music, domain/session, content, audio, persistence, ui/screens, ui/components, accessibility, diagnostics 및 tests/unit, fixtures, integration, e2e, audio, accessibility를 만든다. 도메인 import 금지를 lint 또는 테스트로 강제하라. import alias는 build/test/IDE가 동일하게 해석하도록 한다.
6. scripts를 실제 작동하도록 정의한다: dev, build, preview, typecheck, lint, test:unit, test:integration, test:audio, test:content, test:e2e, test:a11y, verify:reference, check. build는 타입 검사 후 production 빌드. 아직 테스트가 없는 그룹은 검증 미구현이라고 기록하며 passWithNoTests로 성공을 꾸미지 않는다. 첫 최소 smoke 테스트를 만들고 유닛/브라우저 프로젝트를 서로 잘못 수집하지 않게 구분한다.
7. docs/scope.md에 MVP와 후속 경계를 적고 부록 C의 요구 ID를 추적표로 옮긴다. docs/decisions.md에는 미정인 대상 연령·기초 수준·지원 기기·정식 이름·참가자 모집·실제 인력을 설계 가정으로 기록한다. 답이 없다고 임의로 아동 전용 제품으로 만들지 않는다.
8. 파일을 읽고 그릴 수 있는 최소 앱 셸만 띄운다. 이 단계에서 오디오/DB/아트/배포를 시작하지 않는다. 환경 확인에 필요하지 않은 전역 설치·유료 서비스·권한 요청은 하지 않는다.

[실제 실행할 테스트]
node --version 및 package manager 버전; node scripts/verify-reference.mjs docs/design.md src/content/orders.v1.json; typecheck; lint; 최소 unit smoke; production build. 테스트가 없으면 그 그룹은 NOT RUN이지 0개 PASS가 아니다. 소스와 fixtures의 일치 로그를 저장하라.

[통과 기준]
원본과 fixture 8개를 보존하고 독립 reference 검증이 성공한다. 최소 앱 production build/타입/lint가 성공한다. 정확한 버전·설치 방법·단계별 추적표가 있다. 도구 설치/기기 미확보는 사실대로 적는다.

[다음 단계 인계]
S01에 실제 Node·도구 버전, 기준 해시, JSON 경로, 음악 API 초안과 금지 import 방향을 넘겨라.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S00.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S01. 음 표기, 음정, 화음 생성 함수를 테스트부터 구현하라

```text
지금 화음 수리점의 S01만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 4.1~4.5, 13.2~13.4, 17.2 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S00 인계, orders.v1.json, docs/design.md의 타입 계약, 부록 D 음악 회귀 목록.

[만들거나 수정할 파일]
src/domain/music/types.ts, pitch.ts, interval.ts, chord.ts, voicing.ts, index.ts 및 tests/unit/music/*.test.ts. API/예외 정책 문서.

[실행할 작업]
1. Letter C D E F G A B, accidental -2|-1|0|1|2, 정수 octave의 SpelledPitch를 구현한다. 파서는 C4, Eb4, F#4 등 정규 내부 문자열을 엄격 검사하고 UI에서는 ♭/♯를 렌더링한다. 사용자 자유 입력이 없는 MVP에 관대한 문자열 파서를 덧붙이지 마라. 허용 표기 grammar/옥타브 경계/공백 정책은 문서화한다.
2. MIDI=12*(octave+1)+naturalPc[letter]+accidental. 계산 결과가 정수 0~127인지 검증한다. NaN/Infinity, 잘못된 문자/변화표, 결과 범위 밖은 typed error다. 문자열의 octave를 MIDI octave로 덮어쓰지 마라. B#3=60, Cb4=59는 필수 반례다. pitchClass는 ((n%12)+12)%12.
3. 생성 API는 generateTriad(root, quality)와 toMidi, midiToFrequency, parseSpelledPitch, formatPitch, analyzeInterval, analyzeVoicing을 export한다. 3음은 근음 문자 +2, 5음 +4로 문자 철자를 정한 다음 목표 반음값에 맞는 변화표를 구한다. 장 [0,4,7], 단 [0,3,7]. 목표 우선도는 근음 문자/음정/정확 MIDI다. 전역 sharpNames로 화음 이름을 만들지 마라.
4. 세 음 역할(root/third/fifth)은 목표 근음 기준이다. UI 슬롯 index로 역할을 확정하지 않는다. 순서가 뒤섞인 입력에서 실제 최소 MIDI를 찾아 전위를 계산한다. 제1전위는 third가 bass, 제2전위는 fifth가 bass. C4 G4 E5는 기본 위치이면서 넓은 배치다. pitchClass가 화음과 맞지 않으면 전위 이름을 만들어 주지 않는다.
5. 음정은 문자 거리와 반음 거리를 분리해 반환한다. C4→Eb4=(3도,3반음), C4→D#4=(2도,3반음)로 다르다. 내려가는 음정/복합 음정의 지원 범위를 명시하고 미지원은 명시적 오류로 반환하라. 숫자 3을 세 건반 이동이라고 설명하지 마라.
6. spellForTask(midi,targetRoot,targetQuality,displayMap)는 목표 구성음 pitch class면 그 역할의 정규 문자/변화표를 실제 MIDI에 맞는 표기 octave로 복원한다. 그렇지 않으면 주문 map을 사용한다. 63/C minor→Eb4, 70/G minor→Bb4. map 누락/다른 MIDI 대응은 콘텐츠 오류다. map은 정답 생성에 사용하지 않는다. 일반 철자 판정 함수는 입력을 임의로 문맥화하지 않는다.
7. 학습 입력은 60~74로 제한하지만 음고 이론 함수는 0~127의 유효 표기를 다룬다. AudioService 지원 계획 48~84와 UI 입력 범위를 혼동하지 않는다. 이중변화표를 허용 범위 내 정확히 처리하고 범위를 넘는 생성 조건은 unsupported로 보고한다.
8. 입력을 mutate하지 않는 순수 함수로 작성한다. deepFreeze한 fixture에도 작동해야 한다. 한국어 설명/React/오디오/저장은 이 계층에 넣지 않는다.

[실제 실행할 테스트]
부록 D MUS01~MUS14와 source 17.2 반례를 실제 테스트로 만든다. B#3/C4 및 Cb4/B3, 69→440Hz, MIDI 60~74의 단조 증가 주파수, C/F/G 여섯 화음 표기·MIDI, root/third/fifth 역할·순열 불변성·넓은 배치를 검증한다. 모든 지원 근음/변화표에 생성 결과 letter와 반음 간격을 property 형태로 확인하라.

[통과 기준]
모든 지원 음표의 round-trip/음정/화음 fixture가 통과한다. C minor D# 철자를 자동 정답 철자로 쓰지 않는다. root position과 close voicing을 동일 개념으로 반환하지 않는다. 미지원 조건은 숨기지 않는다.

[다음 단계 인계]
S02에 export API, 파서 grammar, typed error 종류, 순열/철자 정책, 실제 test 로그를 전달한다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S01.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S02. 판정 엔진과 8주문 콘텐츠 validator를 완성하라

```text
지금 화음 수리점의 S02만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 4.6, 5, 13.3, 15, 17.2, 부록 A 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S01 API와 로그, orders.v1.json, 부록 A 원본 데이터와 부록 D 회귀표.

[만들거나 수정할 파일]
src/domain/music/grade.ts, src/content/load-orders.ts, validate-orders.ts, tests/unit/grading.test.ts, tests/unit/content.test.ts, tests/fixtures/invalid-content/, docs/content-validation.md.

[실행할 작업]
1. ChordTarget, VoiceSlot, Grade를 원본 13.3과 일치시켜라. Grade는 status invalid/incomplete/incorrect/correct, codes, pitchClassCorrect, spellingCorrect, registerCorrect, inversionCorrect, mismatchedRoles를 갖는다. 미적용 검사와 실제 관찰값을 분리해서 문서화하고 spellingRequired=false에서 철자가 달라도 음고 정답을 막지 않도록 최종 조건을 명시한다.
2. grade(slots,target)는 입력 구조/중복 slot id/유효 음/target 일관성 검사→빈 슬롯→목표 생성→pitch class 다중집합→철자/음역/전위 순으로 판정한다. 세 슬롯의 정확 개수와 null을 구분한다. INVALID_DATA는 앱/콘텐츠 오류이며 사용자 오답으로 집계하지 않는다. null은 INCOMPLETE다.
3. exact는 sorted MIDI 다중집합 비교다. 원본 배열은 복사 후 정렬한다. C4 E4 G4와 G4 C4 E4는 모두 정답, C4 E4 E4는 오답이다. 음고류 다중집합도 빈도까지 보존한다. 지원 후속 target의 pitch-class 모드는 옥타브 무관하며 inversion=null이면 최저음 조건을 요구하지 않는다.
4. 철자 검사는 정규 구성음의 letter/accidental과 대응시켜 입력 순서에 의존하지 않는다. pitch-class 모드에서는 허용 옥타브의 같은 철자를 비교하고 exact 모드의 절대 음고는 register 검사로 확인한다. spellingRequired=true일 때 C D# G는 C minor에 SPELLING_MISMATCH, false이고 MIDI 63 건반 입력은 정답이다. 키보드 정규화와 일반 판정 함수를 섞지 마라.
5. 구성음이 틀리면 inversionCorrect=false이고 MEMBERS_MISMATCH를 함께 설명할 수 있으나 가짜 전위 이름/INVERSION_MISMATCH만으로 원인을 덮지 않는다. 빠진 목표 근음은 ROOT_MEMBER_MISSING, 3음 관계는 THIRD_MISMATCH, 5음은 FIFTH_MISMATCH다. 다중 문제가 있을 때 안정된 코드 우선순위를 정의하라. UI는 하나씩 안내할 수 있도록 구조화된 원인만 받는다.
6. loader는 추가/누락 필드, tuple 길이, 배열 상한, enum, 정수 MIDI, 문자 길이, 버전, 유일 ID, 정답 문항 index, exact/false/0 조건을 엄격 검사한다. root+quality로 계산한 target/targetMidi, 표기에서 계산한 initialMidi가 모두 일치해야 한다. allowedMidi는 60~74, displaySpellingMap은 이 15키만 정확히 한 번 포함하고 값 계산값이 키와 같아야 한다. JSON raw 중복 property가 사라지는 위험을 피하려면 중복 키를 검사하거나 신뢰된 bundled JSON 빌드 검증에 한정하고 외부 import는 별도 엄격 스키마로 차단한다.
7. 수정 가능 index는 중복 없이 범위 안, 비어 있지 않아야 한다. CR01/02는 [1], 다른 주문은 [0,1,2]. 잠긴 초기값은 목표와 같아야 한다. 모든 시작은 목표와 달라야 하며 잠긴 음을 유지하고 허용 MIDI 내 편집만으로 target에 도달 가능해야 한다. target 자체는 grade correct여야 한다.
8. 콘텐츠 오류는 build를 실패시켜라. 런타임에서 훼손되면 contentError 화면과 재시도/목록 복귀를 제공할 수 있도록 typed error를 내보낸다. 정답을 JSON 값과 또 다른 하드코딩 UI 분기 두 군데에 두지 마라. UI는 OrderRunner 하나로 처리한다.

[실제 실행할 테스트]
8 initial 모두 incorrect, 8 target 모두 correct, 각 target 6순열 모두 correct. 초기 오답 코드는 CR01~06 THIRD_MISMATCH, CR07 FIFTH_MISMATCH, CR08 ROOT_MEMBER_MISSING. 중복음/누락/NaN/중복 ID/표기 불일치/target 훼손/map 누락/도달 불가 fixture는 거절한다. exact 다른 옥타브는 pitchClassCorrect=true 및 REGISTER_MISMATCH. pitch-class C/E를 inversion 1,0,null로 각각 검증한다.

[통과 기준]
정답/오답/앱 오류가 분리되고 8주문 validator 오류가 0개다. 잘못된 fixture를 넣으면 CI/build가 실제 실패한다. 순열을 오답 처리하지 않으며 중복음을 놓치지 않는다.

[다음 단계 인계]
S03에 Grade 코드 우선순위와 target 생성 API, validated Order 반환 타입, 전체 판정 테스트 경로를 전달한다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S02.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S03. 시도, 힌트, 제출, 관계 질문을 상태 머신으로 묶어라

```text
지금 화음 수리점의 S03만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 3, 6, 12.1~12.2, 14, 16.2~16.3 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S02의 순수 grade/Order, 원본 상태 전이 표, 부록 D 세션 회귀표. 아직 DB 없이 메모리 adapter로 시작한다.

[만들거나 수정할 파일]
src/domain/session/types.ts, reducer.ts, commands.ts, selectors.ts, evidence.ts, tests/unit/session*.test.ts, docs/session-contract.md.

[실행할 작업]
1. 앱 boot/ready/contentError/recovery, 학습 orderIntro/editing/checking/feedback/reflection/completed, 오디오 locked/preparing/ready/playing/paused/unavailable, 저장 clean/dirty/saving/failed/memoryOnly, 화면 home/orders/workbench/ensemble/sandbox/settings를 분리한다. 한 거대한 status로 조합 상태를 덮지 마라.
2. reducer는 순수 함수다. 오디오 취소/저장/포커스 이동은 명시적 command로 반환하고 외부 adapter가 실행한다. SELECT_SLOT은 잠금 검사, SELECT_PITCH는 선택 슬롯·허용 범위 검사 후 실제 값이 다를 때만 revision+1/undo push/audio cancel/dirty. 같은 값 클릭·event.repeat가 수정으로 누적되지 않아야 한다.
3. CHECK마다 {orderId,attemptId,revision,submissionId}를 캡처한다. GRADE_READY는 네 값이 활성 요청과 모두 같을 때만 반영한다. stale 결과는 무시한다. 동기 grade에도 duplicate submit 방어를 둔다. UI 이중 클릭은 같은 진행 중 요청을 재사용하고 동일 GRADE_READY를 두 번 받아도 완료가 늘지 않는다.
4. 첫 유효 제출 정오는 attempt에서 한 번만 설정한다. invalid/content 오류는 사용자 실패로 세지 않는다. 첫 제출 이후 수정 성공은 finalSuccess와 구분한다. attemptId는 새 주문/명시적 새 연습에서 새로 발급하고 reload/visibility 복귀에서는 유지한다. DB 도입 전에도 serialize/restore 계약을 정의한다.
5. undo 최대 50개는 음 배열/선택 slot snapshot만 보관한다. 도움 최대값/첫 제출/해설 노출을 rollback하지 않는다. 주문 전환 때 undo를 지운다. 원래대로는 시작음으로 복원하되 기존 시도 증거를 보존한다. 시범 전에 편집 snapshot을 별도 보관하고 내 상태로 돌아가기/시범 상태로 연습을 모두 제공할 상태를 만든다.
6. 수리 정답이면 reflection.question으로 이동한다. 이때 짧은 성공 안내만 허용한다. ANSWER는 첫 응답과 후속 응답을 분리, SKIP은 skipped, SHOW_EXPLANATION은 첫 답 전이면 answerRevealedBeforeFirstAnswer=true로 전이한다. 첫 답/skip 뒤 explanation이다. 정답 간격·변경 역할을 미리 보인 tutorial/help도 해당 질문 노출로 기록한다.
7. maxRepairHintLevel과 maxReflectionHintLevel을 독립 보존한다. accessibility/mute/inputMode는 hint가 아니다. 독립 수리와 독립 개념 확인은 서로 다른 selector로 계산한다. 증거 누락은 evidenceStatus=unknown이고 도움 없음이라고 추정하지 않는다. guided CR01/02도 자동으로 독립 성취를 부여하지 않는다.
8. reflection CONTINUE의 완료 명령은 {orderId,contentVersion,completionId}로 멱등이다. 질문 오답/skip/도움 사용이 수리 완료/악기/합주 해금을 막지 않는다. 8개 고유 order 완료만 합주 해금 조건이며 CR08 하나만 완료되었다고 해금하지 않는다. 첫 진행 CR01→08, 모든 첫 과정 완료 후 자유 재방문을 허용한다.
9. HIDDEN은 재생 취소/저장 시도만 요청하고 음·시도·질문 상태를 보존한다. RETURN은 자동 재생하지 않는다. 오디오 실패나 저장 실패는 학습을 초기화하지 않는다. 금지 전이는 무시/typed error 중 정책을 정하고 테스트한다.

[실제 실행할 테스트]
stale orderId/attemptId/revision/submissionId를 하나씩 바꾼 4종; 같은 revision의 다른 주문; 중복 CHECK/GRADE_READY/CONTINUE; first wrong→later correct; hint→undo→reset; demo→return; question reveal→reload용 snapshot→answer; skip→completion; settings 변경→grade 불변; 새 연습 vsreload; 8개 고유 완료 집계 테스트를 만든다.

[통과 기준]
모든 이벤트가 테스트 가능한 순수 전이이고 async 결과가 새 주문을 오염시키지 않는다. 도움/노출/최초 결과의 단조 보존이 증명된다. 저장 스키마가 이 증거를 모두 직렬화할 수 있다.

[다음 단계 인계]
S04에 reducer event/command 목록과 UI selectors, S08용 직렬화 snapshot schema를 전달하라. state machine 그림보다 실행 테스트를 우선 제공한다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S03.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S04. 소리 없이 완주 가능한 CR01 작업대를 구현하라

```text
지금 화음 수리점의 S04만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 6.1, 7, 8, 20.3 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S03 reducer/selectors, S02 validated CR01, 원본 화면/입력 계약. 오디오 adapter는 무음 상태를 명확하게 반환한다.

[만들거나 수정할 파일]
App shell, home/orders/orderIntro/workbench/reflection/completed 기본 화면, NoteSlot/Piano/NotePad/Transport/Feedback, 키보드 focus 관리, tests/integration/workbench.test.tsx, tests/e2e/cr01-silent.spec.ts.

[실행할 작업]
1. 홈에서 소리 없이 시작을 선택하고 주문 설명→작업대→수리 확인→관계 질문→완료가 이어지게 하라. 주문 목표/원래 음/현재 음을 시각적으로 분리한다. 소리를 눌러야 진행되는 gate를 두지 않는다. 녹색 정답 키 표시·자동 검증을 넣지 마라.
2. 실제 button인 세 slot을 그린다. CR01은 slot index1만 편집 가능, 0/2는 잠금 이유를 읽을 수 있다. 눌린 slot/current note를 포커스하되 목표 E4로 자동 이동하지 않는다. slot id는 물리 부품 ID이고 역할은 현재 음과 목표 관계로 표시한다. 잘못된 음을 올바른 third라고 단정하지 않게 3음 자리 등의 문구를 사용한다.
3. Piano는 C4~D5 전체 15반음, 흰건반 56×144px, 검은건반 36×88px를 기본으로 한다. 내부 수평 스크롤과 낮은 쪽/높은 쪽 버튼, 스크롤 힌트를 제공한다. 320px에 강제 축소하지 않는다. 검은건반 hit area를 겹치게 확대하지 마라.
4. 동등한 NotePad는 4열, 48×48px 이상, 간격8px, 15반음 모두 제공한다. 가상건반/큰 음 버튼 선택을 두고 같은 SELECT_PITCH(midi)를 호출한다. 기본 입력 모드는 명시적 사용자 선택을 존중하고 실제 손가락 오탭 관찰에 따라 추후 변경한다.
5. 선택 확정은 click/취소되지 않은 tap 한 번뿐이다. pointerdown은 후속 preview용일 뿐 state 수정하지 않는다. pointercancel, lostpointercapture, blur, pagehide에 gesture를 정리한다. 스크롤/핀치/멀티터치가 음 교체로 이어지지 않게 cancel 상태를 관리한다. touch-action:auto를 유지하고 브라우저 확대를 preventDefault로 막지 마라. pointer 기반 클릭과 키보드 합성 click을 구별하여 키보드를 차단하지 않는다.
6. undo와 원래대로를 연결한다. 변경이 있으면 원래대로 확인창에 이 주문의 현재 음만 되돌린다는 범위를 적고 취소 시 그대로 둔다. 안내·도움·설정·완료를 지우지 마라. 무제한 탐색이 가능하되 50개 이전 undo 제한은 정직하게 표시한다.
7. Tab은 그룹 단위, 방향키는 15음 이동, Enter/Space는 확정, Escape는 editor 닫기와 원래 slot focus 복귀다. roving tabindex와 visible focus를 구현한다. 입력 필드와 화면낭독기를 가로채는 전역 문자 단축키는 넣지 않는다. 변경 live region은 한 번만 읽는다.
8. 390×844를 참고하되 높이 고정하지 마라. safe-area, 주소창 가변 높이, 본문 스크롤, 고정 footer 여백을 처리한다. 320px/가로/200% 확대는 기본 동작 확인을 지금 한다. 장식은 낮의 작업대에 맞는 최소 placeholder이며 자체 SVG 도형으로 충분하다.
9. 성공 직후 상세 해설이 먼저 뜨지 않게 S03을 사용한다. 질문 답변/skip 뒤 C→Eb에서 C→E로의 변화와 유지된 C/G를 설명한다. 초보에게 4반음은 5개 음점 사이 선분4개로 보여 준다.

[실제 실행할 테스트]
CR01 initial→D4 오답→E4 정답→질문→완료; E4→undo→Eb4; reset 취소/확정; 같은 MIDI 재선택 revision 불변; Piano와 NotePad 동일 결과; 방향키/Enter/Space/Escape; slot 잠금; 수평/세로 스크롤 취소. 320/390/844 가로 화면 screenshots와 실제 실행 DOM assertion을 남긴다.

[통과 기준]
소리 없이 CR01 완료 및 되돌리기가 가능하고 원래/현재/목표를 구별할 수 있다. 입력 수단이 판정이나 도움 기록을 바꾸지 않는다. 핵심 버튼이 작은 화면에서 가려지지 않는다.

[다음 단계 인계]
S05에 note preview/transport adapter 인터페이스, pointer 정리 지점, CR01 실제 E2E 경로와 screenshot을 전달한다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S04.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S05. 단일 Web Audio 엔진과 안전한 voice 수명주기를 만들어라

```text
지금 화음 수리점의 S05만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 9.3, 10.1~10.2, 10.4~10.5, 13.1 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S04 UI adapter 경계, S01 frequency 함수, 원본 audio 수치. 현재 공식 Web Audio/React 문서를 함께 확인한다.

[만들거나 수정할 파일]
src/audio/AudioService.ts, create-voice.ts, envelope.ts, mixer.ts, types.ts, 테스트용 clock/context adapter, tests/audio/engine.test.ts 및 offline render 검사, docs/audio-contract.md.

[실행할 작업]
1. 앱 수명주기에서 AudioService를 한 개 주입한다. React render/mount effect마다 AudioContext를 만들지 마라. 명시적 소리 켜기/듣기 이벤트의 사용자 제스처에서 context 생성 또는 resume을 호출하고 실제 state를 확인한다. resume Promise를 기다리는 동안 주문 이동/취소된 요청이 뒤늦게 재생되지 않게 request token을 검증한다. StrictMode setup→cleanup→setup에서 listener/voice/context 중복이 없어야 한다.
2. 지원된 API만으로 합성한다. A4=440, frequency=440*2**((midi-69)/12), reference 배음 진폭 [1,.18,.08]을 정규화하고 Nyquist 이상 배음을 제외한다. 조정 가능한 합성 config에 version을 둔다. 초기 attack .008s, decay .070s, sustain .55, release .120s, gate .9s, master .35다. 낮은 기기 음량으로 시작하라는 UI를 제공하되 .35가 음압 안전을 보장한다고 쓰지 마라.
3. voice의 gain/headroom을 동시 수에 맞춰 설계하고 최대24 voice를 관리한다. 합성 배음 oscillator 수와 musical voice 수의 정의를 구별하라. 한 음의 모든 source는 함께 정리한다. peak 목표 -1dBFS 이하를 offline render로 실제 측정한다. compressor/limiter만으로 clipping을 숨기지 마라.
4. source.start(absoluteAudioTime), AudioParam scheduling을 사용한다. preview 시작 여유 5~20ms, preview gate 최대 .35s. pointerup이 없어도 끝나며 stop이 여러 번 호출되어도 예외/누수가 없어야 한다. scheduled source는 한 번만 시작하고 재생마다 새 노드를 만든다.
5. priority를 compare>normal/ensemble>preview로 명시하고 24를 넘으면 오래된 낮은 우선순위 preview부터8ms fade한다. 비교 3음은 한 묶음으로 유지한다. stopAll과 cancelGeneration은 예약됐지만 아직 시작되지 않은 source까지 취소한다. ended 이후 disconnect 및 registry 제거를 보장한다.
6. mute/volume은 current gain을 안전하게 ramp하고 기존 automation과 충돌하지 않게 처리한다. 0으로 exponentialRamp를 호출하지 마라. cancelAndHoldAtTime 등 부가 API는 feature detect하고 지원되지 않을 때 쓸 fallback을 시험한다. UI 정지 버튼은 언제나 접근 가능해야 한다.
7. time source를 주입할 수 있게 해 단위 테스트에서 audio clock과 wall clock을 독립 제어한다. React state setTimeout으로 음을 켜지 않는다. baseLatency/outputLatency는 진단 값이며 실제 손가락→스피커 지연을 대신하지 않는다. getOutputTimestamp가 없으면 정적/근사 시각 표시로 낮춘다.
8. unavailable/합성 실패를 분류한다. 합성 준비 실패에는 기본 sine fallback 한 번만 시도하고, 실패하면 무음 학습으로 계속한다. 사용자에게 소리가 확실히 들렸다고 가정하지 않는다. 네트워크 샘플·외부 곡·새 audio 라이브러리를 필수로 넣지 않는다.

[실제 실행할 테스트]
주파수/배음 범위/envelope endpoint/음수 duration 거절, voice 등록-정리, stop idempotence, 25번째 voice, StrictMode 이중 lifecycle, closed context 재생 요청, resume reject, mute ramp 및 offline peak를 테스트한다. 실제 브라우저에서 사용자 제스처 후 C4/Eb4/E4/G4가 재생되는지 확인하고 청감 미실행이면 분리 기록한다.

[통과 기준]
단일 context와 정리 계약이 테스트로 확인된다. 24voice 상한/예약 취소/동일 velocity가 보장된다. 오디오 실패가 세션을 지우지 않는다. mock이나 offline peak로 실제 청감·음압 안전을 입증했다고 말하지 않는다.

[다음 단계 인계]
S06에 AudioService API, generation/priority/voice 정의, 브라우저별 검증 상태, offline render 로그를 넘긴다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S05.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S06. 전후 비교와 모바일 오디오 중단·복귀를 연결하라

```text
지금 화음 수리점의 S06만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 10.3~10.7, 14, 17.3~17.4 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S05 AudioService, S03 revision/generation 명령, S04 Transport 및 gesture 처리.

[만들거나 수정할 파일]
src/audio/transport.ts, comparison.ts, scheduler.ts, lifecycle.ts, UI audio 상태 문구, tests/audio/transport*.test.ts, tests/e2e/audio-lifecycle.spec.ts, docs/qa/mobile-audio.md.

[실행할 작업]
1. 원래/현재/전후 비교/한 음씩/정지 버튼을 실제 연결한다. 원래와 현재는 동일 reference 음색·gain·velocity·gate·재생 순서 정책을 사용한다. 현재는 사용자가 누른 순간 세 음과 orderId/attemptId/revision을 immutable snapshot으로 캡처한다. 목표 정답 음을 비교용 현재 대신 재생하지 마라.
2. 비교 타임라인을 audio time 기준 t0+.05 원래 3음, .95 gate끝,1.35 현재3음,2.25 gate끝,2.40 종료로 고정한다. 각 release .12s를 포함하여 겹침이 없어야 한다. 단순 JS setTimeout 두 번으로 구현하지 마라. 수정이 발생하면 오래된 두 번째 화음을 취소하고 다시 비교 안내를 표시한다.
3. 한 음씩은 별도 모드다. 낮은 음순으로 .45s 간격 3개를 제시하고 마지막 동시 화음을 제시한다. 이 모드의 개별 gate/마지막 시작 시각은 원본 미지정 구현 선택이므로 .45s보다 짧은 gate와 release 여유를 가진 명시적 config로 정하고 문서화·시험한다. 전후 버전마다 같은 config를 쓴다. 기본 비교를 몰래 arpeggio로 바꾸지 마라.
4. 마지막 요청만 재생하는 generation을 모든 transport/예약 node/완료 callback에 전파한다. 비교10연타, 뒤로/다른 주문/설정 이동, pending resume 중 취소, 음 수정 시 직전 transport를 정리한다. 완료 효과음/합주가 비교를 덮지 않도록 transport 우선순위를 한 곳에서 관리한다.
5. visibilitychange hidden/pagehide/audio statechange에서 generation++, 큐 timer 취소, 활성 voice10ms fade, future source stop, 세션 저장 command, context.suspend 시도. suspend 실패여도 UI는 paused이며 새 스케줄링을 막는다. cleanup listener를 정확히 해제한다.
6. return/pageshow에서는 자동 재생하지 않는다. '작업은 그대로예요. 다시 듣기를 누르면 재생돼요.'를 보인다. 명시적 입력에서 resume을 요청하고 지금 snapshot으로 처음부터 다시 재생한다. 오래된 큐를 재사용하지 않는다. closed면 그 입력에서 새 context와 그래프를 만들며 이전 참조를 해제한다. interrupted 문자열 지원 여부와 무관하게 running 외 상태에서는 schedule 금지다.
7. 합주용 공용 scheduler는 조회25ms/lookahead100ms, ctx.currentTime+5ms보다 늦은 event가 생기면 정지하고 재시작을 요청한다. 늦은 음들을 몰아서 재생하거나 점수로 처리하지 않는다. 애니메이션은 audio clock에서 파생하며 rAF 정지가 오디오 시작을 바꾸지 않는다.
8. 전화/잠금/앱전환30초/이어폰 해제/장치 변경/브라우저 mute/시스템 volume0/저전력/Bluetooth는 실기기 검사표를 만든다. 접근 못 하는 기기에서 실제 시험을 했다고 말하지 않는다. 자동화의 AudioContext running은 출력이 사용자 귀에 들렸다는 증거가 아니다.

[실제 실행할 테스트]
audio clock으로 .05/.95/1.35/2.25/2.40 예약 검사, 동일 timbre/gain/gate snapshot 검사; 비교 중 edit/undo/reset/order switch/cancel; 10연타; pointercancel+blur 지속음 없음; hidden중 future source0; return 자동 start0; interrupted/closed/resume reject; scheduler late event 정지. 최소 실제 iOS/Android 결과는 확보 시 기기/OS/출력 경로와 기록하고 없으면 BLOCKED 항목으로 남긴다.

[통과 기준]
원래와 현재가 동일 조건으로 실제 다른 음고를 재생한다. stale snapshot과 새 화면이 어긋나지 않는다. 백그라운드 복귀가 무음이며 사용자의 재입력을 기다린다. 기기 검증 부족이 숨겨지지 않는다.

[다음 단계 인계]
S07에 보조기기용 듣기/변경 분리 API, transport cancellation 행동, 기기 미검증 항목과 실제 trace를 전달한다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S06.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S07. 8주문, 도움, 관계 질문을 초보자에게 명료하게 연결하라

```text
지금 화음 수리점의 S07만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 3, 5, 6, 8, 12.1~12.2 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S02 데이터/판정, S03 증거 상태, S04 UI, S06 audio. 부록 A의 전체 한국어 문항과 8주문 순서를 그대로 사용한다.

[만들거나 수정할 파일]
OrderRunner, Tutorial, HintPanel, Reflection, Completed/Orders 화면, src/content/copy.ko.ts, tutorial/hint 콘텐츠, tests/integration/learning*.test.tsx, tests/e2e/eight-orders.spec.ts, docs/learning-evidence.md.

[실행할 작업]
1. 공통 OrderRunner에 데이터로 CR01~08을 연결한다. CR01/02 세 번째가 아니라 배열 index1만 열고 나머지는 고정 이유를 표시한다. CR03~08 세 슬롯을 모두 연다. 초기 순서/완료 후 재방문 정책을 S03과 일치시킨다. 최소 변경 횟수를 정답이나 보너스로 쓰지 마라.
2. CR01 C/Eb/G→C/E/G, CR02 반대, CR03 F/Ab/C→F/A/C, CR04 G/B/D→G/Bb/D, CR05 그 반대, CR06 F/A/C→F/Ab/C, CR07 C/E/F#→C/E/G, CR08 E/Ab/C→F/Ab/C가 정확히 재생·표시·판정되게 한다. CR08 시작음을 E장조라고 이름 붙이지 않는다.
3. 첫 약90초 tutorial T0~T7을 구현하되 시간 제한은 아니다. 소리 켜기/소리 없이 시작, 주문, 세 음, 역할, 3음 선택, 자유 탐색, 확인, 비교 순서다. 모든 단계 skip/replay 가능, 말풍선은 행동 버튼을 덮지 않는다. 직접 정답을 보여 주는 tutorial은 해당 reflection 노출을 기록한다. 음을 보기만 해도 진행 가능하다.
4. CR01 반음 선분4개, CR02 정답 키 없음, CR03 다른 근음으로 같은 관계 및5음7반음 소개, CR04 Bb/A# 건반과 Bb문맥 설명, CR05/06 첫 진입 힌트 자동 노출 없음, CR07 특정 slot 강조 없음, CR08 주문 이름·현재음 중심을 구현한다. CR07 전 선택형 복습은 3음/5음 관계를 다루되 이번 오답 슬롯을 노출하지 않는다.
5. 도움1 관계 설명, 도움2 거리 도구, 도움3 시범을 구현한다. level2가 목표 답/질문 정답을 사실상 공개하면 reflection 노출도 기록한다. level3은 snapshot 백업과 복귀 선택을 제공한다. 시간만으로 팝업하지 않으며 두 번 확인 실패 뒤 비강제 한 줄 제안만 허용한다. 모든 도움은 같은 수리 보상이다.
6. 피드백은 주문 조건+현재 관계 또는 다음 탐색 행동을 담는다. 기본 단계에서는 정답 슬롯을 전부 빨갛게 밝혀 주지 않는다. D4선택 CR01: '장3화음의 3음은 근음보다4반음 위에 있어요. C에서 하나씩 세어 볼까요?' 같은 문구를 명료하게 띄어 써라. multiple mismatch는 순차 안내한다. 정서/우열/오답 경고음/실망 표정/흔들기를 쓰지 않는다.
7. 수리 성공 직후 '주문 조건에 맞아요'만 안내하고 reflection question 먼저 제시한다. 첫 응답/skip 뒤 바뀐 역할과 원래/현재 관계를 해설한다. 해설 먼저 보기 누르면 즉시 도움 연습으로 기록한다. 질문 오답은 '수리는 맞았어요. 이유는 한 번 더 살펴볼까요?'로 구분한다. 틀린 질문 때문에 악기를 회수하지 마라.
8. reflection 선택지 순서는 seeded shuffle로 기록한다. answerIndex는 원본 정답에 대응하는 stable option id로 변환한 뒤 섞어라. 화면 index를 원래 answerIndex와 직접 비교하지 마라. seed/order/contentVersion과 실제 permutation을 저장해 reload에도 동일하게 복원한다. 시각 순서와 스크린리더 DOM 순서를 같게 한다.
9. 개인 기록은 수리 완료/도움 없이 확인/연습 중, first submission/final success, repair help/reflection help, question first answer, reveal flag를 분리한다. mute와 큰 버튼/스크린리더는 힌트가 아니다. '음악 실력92점'·'피아노 연주 습득'을 만들지 않는다. first attempt는 재연습으로 덮지 않는다.
10. 화면 음이름 b/#는 ♭/♯로 렌더링하되 내부 fixture는 바꾸지 않는다. 고정도 병기는 도 C 등이며 이동도/조성 으뜸음이라고 하지 않는다. 'C장3화음'과 'C장조'를 분리하고 Fm/Gm를 C장조 다이어토닉 목록이라 하지 않는다.

[실제 실행할 테스트]
8주문 각각의 시작 오답·목표 정답·다른 슬롯의 대표 오답·undo·도움·질문의 정답/오답/skip/reveal 경로를 검사한다. CR05/06 자동 힌트 없음, CR07/08 초기 정답 슬롯 힌트 없음, 100개 seed의 stable option ID·DOM 순서·reload 불변, 도움받은 8완료의 합주 해금, 질문 전 상세 정답 누출 없음을 확인한다. UI 띄어쓰기와 용어도 별도 검수한다.

[통과 기준]
여덟 주문의 음·문구·질문이 기준 데이터와 일치한다. 최소 한 번씩 third/fifth/root를 직접 바꾸는 경험이 있다. 정답 해설 노출과 학습 증거가 정확히 연결되고 접근성 사용이 불이익이 되지 않는다.

[다음 단계 인계]
S08에 attempt/reflection/shuffle 저장 필드의 최종 목록과 reload해야 할 모든 화면 상태를 넘긴다. 문항별 정답 노출 지도도 포함한다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S07.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S08. 기기 내 저장, 손상 복구, 가져오기와 두 탭 충돌을 구현하라

```text
지금 화음 수리점의 S08만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 14, 15.2, 16, 18, 19 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S03 snapshot/evidence와 S07 shuffle/질문 상태, 원본 IndexedDB stores, 부록 D persistence 회귀표.

[만들거나 수정할 파일]
src/persistence/db.ts, repository.ts, schemas.ts, migrations.ts, import-export.ts, tab-coordinator.ts, recovery.ts, Settings 저장 UI, tests/integration/persistence*.test.ts, tests/e2e/recovery*.spec.ts, docs/storage-contract.md.

[실행할 작업]
1. DB chord-repair-shop version1, stores meta/profile, settings/main, attempts/attemptId, progress/orderId, draft/active, backup/previous를 만든다. 실제 IDB schema version과 contentVersion을 분리한다. 다른 앱 storage와 공유하지 마라. schema validator를 read/write/import 경계 모두에 적용한다.
2. draft에는 orderId,attemptId,contentVersion,revision,세음,선택slot,학습/질문 단계,최대 도움2종,첫 제출,첫개념답,해설노출,completionId와 shuffle seed/permutation을 보존한다. booleans의 누락은 false와 다르다. source의 증거가 빠진 구버전은 evidenceStatus=unknown으로 기록한다.
3. 음 변경은300ms debounce/maxWait 1초, HINT/CHECK/ANSWER/SHOW_EXPLANATION/SKIP은 증거와 draft를 즉시 동일 transaction으로 쓴다. 완료는 progress + attempt + draft 정리를 한transaction으로 커밋한다. request onsuccess와transaction oncomplete를 혼동하지 않는다. transaction 내부 unrelated await로 자동 비활성화시키지 말고 read/compare/write를 같은 활성 transaction 흐름으로 묶어라.
4. meta의 전역 저장 revision과 세션의 음 revision 의미를 구분한다. 한 attempt의 revision이 낮아졌다고 늦은 callback이 새 state를 덮지 못하게 한다. 저장작업은 최신 스냅샷 기준으로 직렬화하거나 compare-and-swap 검사를 한다. 새로고침/복귀는 attemptId/first/hint/reveal을 유지한다.
5. 완료 UI는 저장 성공과 게임 성공을 분리한다. transaction 실패여도 수리 성공은 유지하고 memoryOnly/failed 배너, 재시도/내보내기를 제공한다. 브라우저를 닫으면 잃을 수 있음을 명확히 한 번 알린다. pagehide flush는 보조 수단이지 유일한 저장 시점이 아니다. 무한 재시도 루프를 만들지 않는다.
6. 시작 시 validation → 정상 backup → migration → 원자적 교체 순서다. 손상 발견만으로 deleteDatabase하지 않는다. 이전 정상 기록/현재 읽을 수 있는 기록 내보내기/새로 시작 선택을 제공한다. 새로 시작에는 이 앱 학습기록 삭제 범위를 확인시키며 명시적 선택 전 삭제하지 않는다. settings까지 지울지 별도 명시한다. backup도 검증하고 둘 다 손상되면 원본 보존 가능한 범위와 복구 한계를 알린다.
7. export 파일명 chord-repair-progress-v1.json, UTF-8 bytes 256KB 이하, schema/contentVersion/진행/설정/시도 요약만 포함한다. audio buffer/디바이스 ID/연락처를 넣지 않는다. 최근 상세 100시도, 과거 주문별 summary로 압축하면서 첫 시도 증거·도움·최근 성취를 유지한다. 크기 상한 때문에 first evidence를 몰래 버리지 않는다.
8. import는 File.size를 읽기 전에 제한하고 parse 후 deep schema/tuple/배열/문자 길이/버전/ID/정수/프로토타입 키(__proto__,prototype,constructor)의 허용 여부를 재귀 검증한다. 256KB를 넘으면 구체적으로 거절한다. HTML/script/URL을 실행하지 마라. 통과 후 교체 내용 요약과 기존 기록 백업을 설명하고 사용자가 확인하면 transaction으로 교체한다. MVP 자동병합은 없다. 미래 버전은 조용히 downgrade하지 않는다.
9. BroadcastChannel이 있으면 활성 편집자 알림과 읽기 전용 탭 UI, 만료시간과 명시적 인수를 구현한다. 초기 동시 진입 race도 생각하라. 채널 메시지는 신뢰된 권한이 아니라 조정 힌트이며 실제 commit은 transaction revision/owner token 검증으로 보호한다. 미지원도 같은 충돌검사로 덮어쓰기를 막는다. 열린 탭이 crash해도 영구잠금이 남지 않게 하라. background 탭 lease 갱신만으로 영구점유하지 않게 정책을 명시한다.
10. 저장은 기기/브라우저에 국한되며 영구/자동동기화가 아니다. 자동 persistent storage 권한 요청, 클라우드 업로드, analytics 전송은 넣지 않는다. 설정 변경도 진행·판정과 분리해서 저장한다.

[실제 실행할 테스트]
정상reload, reflection question/explanation 각각reload, hint 직후reload, firstWrong → reload → correct, demo복귀, quota/security/abort 오류, 늦은revision, 중복completion, 유효backup/둘다손상, 구버전unknown/미래버전거절, import256KB 경계/잘못된JSON/과대배열/prototype, import취소/transaction실패원자성, 두 탭동시write/owner종료/lease인수/채널미지원. 실제 브라우저IDB 테스트와 fakeIDB 테스트를 구분한다.

[통과 기준]
저장 실패에도 플레이를 계속하고 상태를 정직하게 알린다. 최초/도움/노출 증거가 손실·위조되지 않는다. 깨진 데이터를 자동 삭제하지 않고 import는 명시적 교체다. 경쟁 저장이 진행을 되돌리지 않는다.

[다음 단계 인계]
S09와 S11에 migration/복구 지원 범위, import fixture, 두 탭 재현 방법, 저장 증거 샘플, 미검증 브라우저를 넘긴다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S08.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S09. 접근성과 작은 화면의 동등 조작 경로를 마무리하라

```text
지금 화음 수리점의 S09만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 7, 8, 9.1, 17.4 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S04~S08 전체 흐름, 원본 WCAG 목표/제품 타깃 크기, 부록 D 접근성 매트릭스.

[만들거나 수정할 파일]
접근성/레이아웃 수정, tests/accessibility/*.test.tsx, tests/e2e/accessibility.spec.ts, docs/qa/accessibility.md, 320/390/768/가로/확대 screenshot 세트.

[실행할 작업]
1. 실제 button/label/heading/landmark 중심으로 DOM을 감사하라. 슬롯의 selected/locked 상태, 피아노의 음 이름·옥타브·선택, 검은건반의 접근성 이름인 플랫/샵, mute/stop/volume 이름을 검수한다. role/aria를 과하게 중복하지 않는다. inert/aria-hidden 사용 시 실제 포커스 이동도 함께 처리한다.
2. Tab은 그룹 이동, 방향키는 음 이동, Enter/Space는 실행, Escape는 닫기다. 패널을 닫으면 원래 슬롯으로, 화면을 전환하면 제목으로, 오류가 나면 관련 안내로 포커스를 연결한다. 모달은 포커스 순환과 종료 경로를 제공하고 닫으면 trigger로 돌아온다. 오디오 상태 변화마다 포커스를 빼앗지 마라.
3. 주요 버튼은 제품 목표 44px 이상, NotePad는 48px 이상·간격 8px, 피아노 검은건반은 36px와 동등한 큰 음 버튼 경로를 유지한다. WCAG 2.2 AA의 24 CSS px 최소 타깃 기준과 제품 목표 44px를 같은 숫자로 설명하지 마라. 독립적인 hit area를 겹치게 늘리지 않는다.
4. 실제 색 조합별로 본문 4.5:1, 큰 글자 3:1, 필수 UI 경계·상태 3:1 대비를 검사한다. 선택·잠금·결과는 텍스트/윤곽/도형을 병행한다. 장·단을 녹색/빨강으로 암호화하지 마라.
5. 320px, 200%/400% 확대, 시스템 글자 확대, 세로/가로, notch/safe-area, 주소창 높이 변동에서 본문이 재배치되어야 한다. 페이지 전체의 가로 스크롤은 없어야 한다. 피아노 내부 수평 탐색과 동등한 NotePad 경로를 구분하라. 고정 footer가 마지막 입력·내보내기·오류 버튼을 가리지 않게 한다.
6. prefers-reduced-motion을 초기값에 반영하고 사용자 설정과 정적인 완료 장면을 제공한다. 진열은 300ms 이하이며 건너뛸 수 있다. 자동 재생·깜박임·화면 흔들기는 없다. 음량·정지·mute는 비교/합주 중에도 접근 가능해야 한다.
7. 듣기와 음 바꾸기를 화면낭독기 명령으로 분리한다. polite live region은 실제 변경 한 번에 한 번만 읽고 매 tick/hover/preview마다 읽지 않는다. 소리 없이 각 주문·관계 질문·설정·내보내기·가져오기까지 완료 가능해야 한다.
8. 자동 접근성 검사와 실제 VoiceOver/TalkBack/키보드 검사를 구분하라. 가능한 기기에서 핵심 흐름을 직접 수행하고 기기·OS·브라우저·AT 버전·실패 동작·수정 후 재시험을 기록한다. 수동 검증 없이 AA 적합 완료라고 발표하지 마라.

[실제 실행할 테스트]
8주문 전체를 키보드만으로 수행하고 NotePad/Piano 입력 동등성, 포커스 복귀, 모달, 화면 전환, 중복 live 안내, 무음 완주, 확대·대비·reduced motion을 검사한다. 자동 검사 0건만으로 수동 검증을 대체하지 말고 실제 기기별 표를 채운다.

[통과 기준]
핵심 흐름 차단 0건, 작은 화면/확대에서 숨은 행동 0건이어야 한다. 화면낭독기 사용이 hint/evidence를 바꾸지 않는다. 수동 미확인은 출시 게이트로 남긴다.

[다음 단계 인계]
S10에 접근 가능한 컴포넌트와 토큰을 넘겨 장식 추가로 회귀하지 않게 한다. S11에 screenshots와 실제 AT 검증 근거를 전달한다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S09.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S10. 교대 합주, 자유 실험과 독립적인 수리점 아트를 완성하라

```text
지금 화음 수리점의 S10만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 1, 8~9, 11, 18, 20.7 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S06 scheduler/transport, S07 완료 기록, S09 접근성 UI, 원본의 8마디 악보와 자산 목록.

[만들거나 수정할 파일]
src/content/ensemble.v1.json, src/audio/ensemble-events.ts, Ensemble/Sandbox/Shelf 화면, 자체 SVG/WebP 자산, public/licenses/asset-ledger.json, tests/unit/ensemble.test.ts, tests/e2e/ensemble-sandbox.spec.ts.

[실행할 작업]
1. 8개 고유 주문 완료 시 교대 합주를 해금한다. 수리 도움·질문 오답·무음은 해금을 막지 않는다. 미완료 상태에는 필요한 완료를 설명하고 전체 합주를 자동 재생하지 않는다. 8악기가 무대에 보여도 모든 수리 화음을 동시에 울리지 마라.
2. 합주 순서는 CR01 C[60,64,67], CR02 Cm[60,63,67], CR03 F[65,69,72], CR06 Fm[65,68,72], CR05 G[67,71,74], CR04 Gm[67,70,74], CR08 Fm[65,68,72], CR07 C[60,64,67]이다. 주문 진행 순서와 다르다는 점을 테스트로 고정한다. 80 BPM, 4/4, 8마디, 1박 0.75초, 본문 24초와 마지막 여유 0.4초다.
3. 앞 7마디의 root는 박0/2에서 gate 1.4박, third는 박1/3에서 gate 0.8박, fifth는 박0.5/1.5/2.5/3.5에서 gate 0.3박이다. 마지막 마디는 세 음을 박0에서 gate 3.5박으로 동시에 연주한다. release는 0.12초다. 모든 gateEnd+release <= nextBarStart-0.01초를 검사한다. 가장 늦은 fifth는 3.5+0.3+0.12/0.75=3.96박에 끝나므로 마디 끝까지 30ms 여유다. event 수는 59개(7×8+3)다. 24.4초는 transport 마무리 시각이며 마지막 gate를 여기까지 늘리지 마라.
4. root/third/fifth 파트에 자체 합성 음색을 배정한다. reference/pluck/reed/bell을 사용하되 음정은 정확해야 한다. 전체 듣기·파트별 solo/mute·정지를 제공한다. solo/mute 충돌 규칙을 명시하고 mono에서도 역할 정보가 사라지지 않게 한다. 자동 반복과 타이밍 과제를 추가하지 마라.
5. 합주는 사용자 선택으로 시작한다. 비교 듣기·다른 주문·hidden이 발생하면 완전히 취소한다. 재생선은 audio clock에서 파생하며 프레임 저하가 예약 시각을 바꾸지 않는다. 서로 다른 마디의 장·단3음이 겹치는 문제를 event 시간 검사로 막는다.
6. Sandbox는 C/Cm/F/Fm/G/Gm 프리셋, MIDI 60~74 편집, 현재 듣기와 초기화를 제공한다. '자유 실험, 평가하지 않아요'를 명시하고 주문 progress/attempt/도움 기록을 쓰지 않는다. 자유 모드의 최근 음을 수리의 정답/현재 음으로 잘못 복원하지 마라. 출입 시 transport 정리와 포커스를 유지한다.
7. 낮의 작은 수리점·종이 주문서·오르골·세 음 조각을 독립 아트로 제작한다. 기능은 DOM, 장식은 SVG/WebP다. 이미지 안에 글자를 박거나 다른 게임의 로고·꿈 장면·캐릭터를 복제하지 마라. 역할은 색뿐 아니라 모양과 글자로 구분한다. 손님 4기본형과 8주문의 소품 차이를 주되 실망 표정·유아 전용 문구는 피한다.
8. 자산 예산은 배경 250KB, 주요 소품 각각 80KB, 손님 각각 60KB, token 각각 3KB, icon 각각 2KB 이하다. 초기 전체 1.5MB, 전체 자산 5MB 이하다. 시스템 글꼴을 우선한다. 자산 장부에 제작자·직접 제작 여부·출처·허용 범위·파일 해시·날짜를 기록한다. 생성형 자산도 실제 사용과 검수 여부만 적고 미제작 자산을 완료 표시하지 마라.
9. 완료 효과음 0.2~0.4초는 학습 화음 뒤에 작게 재생한다. 비교를 덮지 않는다. 모션 300ms 이하·건너뛰기·reduced motion을 지킨다. 장식이 부족하다고 정확한 소리·저장·접근성을 삭제하지 마라.

[실제 실행할 테스트]
59 event·8마디·순서·tempo·모든 release 경계·마지막 gate, 상충 화음 동시 재생 없음, solo/mute/stop, hidden 취소, 8완료 해금, 도움받은 완료의 동등 보상, 중복 보상 없음, Sandbox 진행 불변, 장식 전후 domain 회귀 동일, 자산 크기·라이선스를 검사한다.

[통과 기준]
교대 합주가 정확한 음과 시간으로 끝나고 자동 반복하지 않는다. 자유 실험이 평가를 오염시키지 않는다. 아트·음원의 권리 근거가 있고 장식이 입력·읽기·소리를 방해하지 않는다.

[다음 단계 인계]
S11에 합주 event dump, 시간 검증 로그, 자산 장부, 성능 예산 측정 입력을 넘긴다. 아직 없는 자산은 명확히 표시한다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S10.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S11. 전체 회귀, 실제 기기, 성능과 보안을 검증하고 고쳐라

```text
지금 화음 수리점의 S11만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 17~19, 20.9, 24 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S00~S10 코드·인계·알려진 결함, 부록 C 추적표/D 회귀표/E QA 템플릿, 실제로 접근 가능한 기기 목록.

[만들거나 수정할 파일]
누락 테스트와 결함 수정, docs/qa/test-report.md, device-matrix.md, performance.md, security-review.md, requirements-traceability.md 갱신, 실제 logs/traces/screenshots와 재현 방법.

[실행할 작업]
1. 요구 ID별 구현 파일·자동 테스트·수동 검사·결과·증거를 연결한다. 부록 D 각 행에 test ID 또는 manual case를 할당한다. 정답 고정 버튼, stub 반환, fixture ID를 결과로 직접 매핑하는 치팅이 없는지 소스를 검토한다. E2E는 실제 사용자 행동을 검증하고 그 기능 자체를 mock하지 마라.
2. clean install → reference → content → typecheck → lint → unit → integration → audio → E2E → accessibility → production build 순서로 실행한다. CI는 허용된 기존 저장소 범위에서 준비하고 외부 서비스를 새로 연결하지 않는다. 명령·버전·exit code·테스트 수·아티팩트를 남긴다. no tests나 skip으로 초록 결과를 만들지 마라.
3. Chromium/Firefox/WebKit, 390×844/320px/가로 화면/터치/데스크톱 키보드를 시험한다. WebKit 자동화는 실제 iOS Safari가 아니다. 출시 시점의 iOS Safari 최신 안정판과 직전 주요 버전, Android Chrome 최신, desktop Chrome/Safari/Firefox 중 실제 검증한 정확한 버전만 지원 표에 적는다.
4. 모바일 오디오는 첫 unlock, 10연타, 비교 중 수정, 화면 잠금, 앱 전환 30초, 전화/미디어 중단, 출력 장치 변경, 유선/내장/Bluetooth, 저전력, 브라우저 mute/시스템 음량0, closed context를 검사한다. 자동 재생·과다 음량·오래된 큐·지속음이 없는지 실제 확인한다. 사람이 장·단을 구별하는 교육 시험과 엔진이 세 음을 재생하는 검사는 다르다.
5. 실제 IndexedDB에서 quota/거부/손상/구버전/미래 버전/두 탭/reload/콘텐츠 버전 차이를 시험한다. 최초 로드 뒤 offline으로 전환해 수리·소리·저장·합주가 이어지는지 확인한다. 브라우저를 닫고 offline 재실행하는 것은 MVP 보장 범위가 아니다. CSP와 필수 로컬 resource의 동작도 확인한다.
6. production build에서 초기 JS gzip 250KB, 작업대까지 전체 전송 1.5MB, 전체 MVP 자산 5MB 이하를 측정한다. 고정 중급 기기·명시된 제한망에서 첫 의미 있는 화면 2.5초, 탭→paint p95 100ms, 탭→audio 예약 p95 30ms를 초기 목표로 검사한다. 샘플 수·워밍업·기기·망·계측 방법을 남긴다. 실제 내장/유선 스피커 p95 100ms 목표는 외부 실측 없으면 미측정이다. Bluetooth는 별도 보고한다.
7. 20분 동안 수정·비교·주문 전환·합주·정지를 반복해 heap/voice/listener/timer 표본을 남긴다. voice 24개 이하, 정지 후 정리, 지속 성장 없음이 기준이다. 한 번의 heap 값으로 누수 없다고 단정하지 마라. 성능은 장식 애니메이션→그림 크기→동시 음색 수 순으로 줄이며 판정·접근성·복구를 삭제하지 않는다.
8. 보안 검수는 build 포함 콘텐츠, 외부 HTML/script 실행 없음, import 크기·배열·스키마·프로토타입 키, 오류 로그의 개인 기록 전송 없음, 마이크/카메라/위치 요청 없음, analytics/account/payment 없음이다. 배포용 CSP/Permissions-Policy 제안은 현재 hosting 지원을 확인해 문서화하되 승인 없이 서비스 설정을 바꾸지 마라. 의존성 출처·버전·라이선스·취약점의 실제 영향과 대응을 기록하고 무조건 major upgrade하지 않는다.
9. 실패는 재현 테스트→최소 수정→관련 회귀→전체 영향 회귀 순으로 고친다. 실기기나 화면낭독기가 없으면 미검증 위험으로 남기고 가능한 로컬 작업은 계속한다. 교육효과·접근성 규격 적합·법률 문제가 없다는 결론을 증거 없이 쓰지 마라.

[실제 실행할 테스트]
부록 D 전체와 원본 17.3 실패 시나리오 12개, 키보드/AT/확대, production offline 세션, 성능/누수, 제한된 안전 import fuzz를 수행한다. 미실행은 NOT RUN과 이유, 결론 불충분은 INCONCLUSIVE로 남긴다. 수정 전후 증거를 구별한다.

[통과 기준]
음고·철자·정답 불일치, 갑작스러운 자동 소리, 진행 삭제, 도움의 독립 성취 오기록, 핵심 접근성 차단, 권리 미확인 외부 자산은 출시 차단이다. 필수 검증 미완료이면 출시 승인을 추천하지 않는다. 실제 통과한 범위만 PASS라고 한다.

[다음 단계 인계]
S12에 초보자 관찰로 확인할 혼동·오탭·오개념을, S13에 재현 가능한 QA 증거·미검증·남은 위험을 넘긴다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S11.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S12. 사용성 관찰과 독립 전이 검증을 준비하고 허가된 범위만 수행하라

```text
지금 화음 수리점의 S12만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 2, 5~6, 12, 20.8, 23 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S11 출시 후보와 기술 QA, 원본 교육 가정/평가 문항. 참가자 연락·개인정보 수집·녹화·일정의 별도 승인 여부.

[만들거나 수정할 파일]
docs/research/usability-protocol.md, transfer-item-bank.md, consent-and-data-plan.md, findings-template.md. 승인된 관찰을 실제 했다면 익명 요약·수정 diff·재시험 근거.

[실행할 작업]
1. 승인 범위가 코드 개발인지 연구 실행까지인지 먼저 확인한다. 참가자 모집·연락·녹화·민감정보 수집·지연 연락을 임의로 실행하지 마라. 승인 없이도 연구 계획·관찰표·문항 정답·동의 초안은 로컬 문서로 준비할 수 있다. 허구 참가자·결과·정확도·리뷰 인용을 만들지 않는다.
2. 입문자 6~8명의 관찰은 조작 장애를 찾는 제안 규모다. 일반 교육효과를 입증하는 표본이라고 하지 마라. 대상 연령·기초 경험·기기 조건을 명시하고 아동 대상이면 필요한 보호자 절차 확정 전에 실행을 보류한다. 수집 항목·목적·보관 기간·철회 방법을 최소화하고 게임 사용을 연구 동의에 묶지 않는다.
3. 설명 없이 시작, 목표/원래/현재 구별, 음 교체, CR03 관계 일반화, CR07/08 역할 확인, 도움 사용, 질문/해설 순서를 관찰한다. '무엇을 보고 그 음을 골랐나요?', '근음이 바뀌면 무엇을 확인하나요?'처럼 중립적으로 묻는다. '가운데를 바꿔 보세요'처럼 정답 행동을 유도하지 않는다.
4. 8주문 완료, 독립 개념 첫 답변, 새 표현·근음·악기로의 전이는 별도 결과다. 단계 통과·힌트 없이 탭·기계의 소리 재생 정상 여부를 학습효과로 합산하지 않는다. 조작 80%, 목표/원래/현재 구별 80%는 내부 목표이며 관찰 분모와 개별 사례를 함께 보고한다.
5. 문항 은행에 C4 E4 G4의 근음/3음(C/E), 장·단 근음→3음(4/3반음), E4 G4 C5가 C 음 모음인지(예, C E G), A3 단3화음(A3 C4 E4), 이미 맞는 A3 C4 E4의 수리 불필요, D4 장3화음(D4 F#4 A4), 같은 근음·음색의 장/단에서 더 높은 3음(장), 다른 악기에서 장→단(3음만 반음 낮춤)을 넣는다. MIDI [57,60,64]와 [62,66,69]를 검산한다.
6. 전위 명칭을 가르치지 않았으므로 제1전위라는 용어를 요구하지 마라. 새 배치 인식은 탐색적 결과이며 기본 학습 통과율에 넣지 않는다. 오선 읽기·운지 실패를 화음 개념 실패로 혼동하지 않는다. 무음 모드는 구조 학습이며 청각 성취로 집계하지 않는다.
7. 전이 fixture는 transfer namespace에 두고 CR01~08이나 해금 조건에 섞지 마라. 선택적인 '다른 모양으로 확인하기' 연습은 별도 음 버튼 배열로 제공할 수 있으나 연습한 문항을 독립 전이 검사에 다시 쓰지 않는다. 앱 밖 평가와 앱 안 연습 항목을 분리한다.
8. 교육효과 연구를 한다면 담당자가 표본 수·사전 능력·효과 크기·비교 조건·분석을 별도로 설계한다. 평행 문항 A/B, 순서 균형화, 사전/사후/가능하면 7~14일 지연 평가를 제안하되 동의 없이 연락을 예약하지 마라. 음악 밖 지능·집중력·학업 향상을 주장하지 않는다.
9. 실제 관찰에서 문제가 나오면 용어·음 선택 도구·비교 조건·안내 제거 시점을 먼저 고친다. 보상·캐릭터 추가로 교육 문제를 덮지 않는다. S07/S09/S11 관련 회귀를 다시 실행하고 새 관찰이 필요하면 미완료로 표시한다.

[실제 실행할 테스트]
문항 정답 검산, 교육 중 정답 노출 여부, 관찰 질문의 유도성, 데이터 최소화, 동의·연락 권한을 검토한다. 코드 수정 시 관련 unit/integration/E2E를 재실행한다. 사용자 실험이 없으면 NOT RUN, 효과 수치는 공란이다.

[통과 기준]
교육 검증의 목적·정답·독립성·권한을 구분한 실행 가능한 관찰 패키지가 있다. 실험을 하지 않았다면 분명히 적고 원본의 출시 전 관찰 게이트 미완료를 S13에 넘긴다.

[다음 단계 인계]
S13에 실제 관찰 여부, 교육적으로 위험한 미해결 설명, 고친 화면, 검증 근거·미검증·승인 대기 항목을 넘긴다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S12.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S13. 출시 후보를 감사하고 개발 인수인계를 완성하라

```text
지금 화음 수리점의 S13만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 18~24 및 모든 단계의 게이트 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
전체 인계·추적표·소스·lockfile·자산 장부·QA·연구 결과. 사용자 배포 승인은 이 단계에 포함되지 않는다.

[만들거나 수정할 파일]
docs/release/release-candidate.md, release-notes.md, supported-environments.md, rollback.md, operations.md, known-issues.md, 최종 build/해시 manifest, README 실행·검증·인수인계.

[실행할 작업]
1. 원본 처음부터 최종 체크리스트까지 요구사항을 다시 대조하라. 가능하면 구현자와 다른 검토자에게 음악·오디오·학습 증거·저장·접근성 검토를 받는다. 독립 검토가 없으면 자체 점검이라고 쓴다. 발견 사항은 영향·재현·수정·재시험으로 남긴다.
2. releaseId에 앱 코드·contentVersion·자산 manifest·lockfile을 묶는다. 원본/fixture/reference 검증을 다시 실행하고 clean production build를 만든다. 음고·순열·철자·상태·보상 불변식을 최종 확인한다.
3. 실제 명령·로그·기기 표, 관찰 수행 여부, 정확한 지원 버전, 알려진 한계, 기기 내 저장의 한계, 무음 구조 학습과 청음의 구분을 릴리스 노트에 쓴다. 미검증 버전 지원·AA 적합·학습효과·즉시 소리 응답을 보장하지 마라.
4. 원본 24장의 각 항목에 PASS/FAIL/NOT RUN/BLOCKED와 근거를 단다. 음악 오류·자동 큰 소리·진행 삭제·독립 증거 오염·핵심 접근성 차단·권리 미확인은 출시 차단이다. 실기기/교육 관찰 미완료를 장식 부족과 같은 사소한 항목으로 내리지 마라. 중요 검증이 남으면 '개발 후보, 출시 준비 미완료'라고 보고한다.
5. 롤백 문서는 이전 정상 정적 build 보관, 새 버전 해제, 저장 schema 호환, 내보내기, 회귀 확인 순서를 설명한다. 이전 버전이 없으면 있다고 꾸미지 않는다. 저장 데이터를 임의 삭제하는 롤백을 만들지 마라. 공개하지 않은 후보를 실운영 롤백 완료라고 하지 않는다.
6. 운영 문서는 실행 명령·production 미리보기·테스트 환경·콘텐츠 변경 시 검증·자산/라이선스 갱신·오류 재현·save backup/import·알려진 오디오 특성을 담는다. 비밀이나 사용자의 실제 기록을 넣지 마라. 무계정·무서버 범위를 지킨다.
7. 사용자에게 실제 작동하는 기능, 실행/파일 경로, 검증 범위, 남은 차단, 미배포 상태를 정확하게 보고한다. 후속 기능을 무단 구현하지 마라. 공개 URL·도메인·유료 플랜·계정이 필요하면 S14의 별도 결정을 받는다.

[실제 실행할 테스트]
전체 clean check, artifact hash/manifest 일관성, 8주문 수동 표본, 출시 차단 근거, 문서의 실행 명령, 자산 권리·네트워크 요청·namespace를 확인한다. 미실행 기기/관찰을 숨기는 완료 문구가 없는지도 검수한다.

[통과 기준]
검증 상태와 허용 범위가 모순 없는 인수인계가 있다. 공개는 하지 않는다. 필수 출시 게이트를 실제 통과해야만 출시 준비 완료라고 쓴다.

[다음 단계 인계]
배포 요청이 오면 S14에 정확한 승인 대상·후보 해시·남은 차단을 넘긴다. 요청이 없으면 여기서 개발 작업을 끝내고 새 권한 없이 공개하지 않는다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S13.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


### S14. 별도 승인된 경우에만 HTTPS 정적 배포와 사후 확인을 하라

```text
지금 화음 수리점의 S14만 실행하라. docs/promptpack.md의 M00을 적용하고 docs/design.md의 20.9, 21, 19 및 실제 배포 승인 및 docs/implementation-status.md, 직전 단계 인계 파일을 먼저 읽어라. 기존 사용자 변경을 보존하고 개발/검증과 공개 배포 권한을 구분하라. 선행 계약이 깨져 있으면 최소 수정 후 회귀를 실행하고 이 단계 결과에 기록하라.

[입력]
S13 출시 후보·해시·검증표, 사용자의 명시적 배포 요청, 대상 호스팅·프로젝트·계정·공개 범위. 없으면 배포 행동은 보류한다.

[만들거나 수정할 파일]
승인 범위에서 실행한 경우 실제 URL/releaseId/hash/환경/사후 smoke/롤백 상태. 미승인이면 필요한 결정 목록만 제공한다.

[실행할 작업]
1. 현재 대화의 승인 내용을 확인한다. 프롬프트팩 보유·로컬 build 성공·정적 배포 가능이라는 설계는 공개 승인이 아니다. 호스팅·공개 여부·도메인·비용 한도·계정·필수 약관이 불명확하면 최소한의 결정을 묻는다. API 키·카드·비밀번호를 대화나 repo에 넣으라고 요구하지 마라.
2. 지속 접근 grant, 새 credential, 보안 설정, 구매, DNS, 공유 권한 변경은 해당 승인 요건을 지킨다. 자동 approve·보안 경고 우회·유료 업그레이드·CAPTCHA 자동 해결을 이 지시의 일반 허용으로 간주하지 마라. 인증은 지원되는 안전한 경로를 사용한다.
3. S13 차단이 남으면 승인된 개발 미리보기인지 정식 출시인지 구분하고 충돌을 해결한다. 승인된 artifact만 업로드하고 base path·SPA route fallback·MIME·HTTPS·cache·CSP를 현재 호스팅 문서에 맞춰 검사한다. 로컬 미리보기와 공개 배포를 구별한다.
4. MVP에 Service Worker·PWA·offline 재실행·분석·로그인·서버를 끼워 넣지 않는다. 로드 후 offline 세션만 지원한다. PWA는 별도 설계·승인·releaseId와 cache 업데이트 검증 이후다.
5. 배포 완료 응답만 믿지 말고 실제 URL에서 최초 로드·자산·CR01 무음·사용자 제스처 오디오·8주문 콘텐츠·새로고침 route·저장 복원·보안 header·모바일 레이아웃을 검사한다. 원격 확인의 한계와 실기기 미확인을 기록한다. 배포된 hash/contentVersion은 후보와 같아야 한다.
6. 실패하면 승인 범위 내 원인 진단·안전한 재시도·사전 합의된 롤백을 수행하고 현재 노출 상태를 알린다. 성공 URL을 추측하지 않는다. 의도치 않은 수집·권한 확대가 필요해지면 멈추고 구체적인 결정을 받는다.
7. 실제 URL, releaseId, 해시, 검증 범위와 한계, 추가 비용/약관 변경을 알린다. 새로운 모니터링·연락·유료 서비스를 자동 등록하지 마라.

[실제 실행할 테스트]
승인 근거·정확한 대상·artifact hash 일치, HTTP/HTTPS, 콘텐츠/자산/route/cache/CSP, 가능한 실기기 smoke, 허용된 롤백 검증을 수행한다. 승인 없이 가능한 것은 read-only 준비와 로컬 검사까지다.

[통과 기준]
명시적으로 승인된 배포만 실행되고 실제 URL에서 정상 동작을 확인한다. 권한·비용·공개 범위를 확대하거나 실기기 결과를 과장하지 않는다.

[다음 단계 인계]
운영자가 다음에 확인할 release·환경·복구 절차와 알려진 제약을 전달한다. 추가 작업은 새로운 요청 범위를 따른다.

[마감 보고]
M00 형식으로 실제 변경 파일, 명령·exit code·증거 경로, PASS/PARTIAL/BLOCKED, 미실행 검사, 다음 입력을 보고하라. docs/handoffs/S14.md와 docs/implementation-status.md를 갱신하라. 테스트나 실기기 결과를 지어내지 마라. 이 단계의 허용 범위를 넘는 외부 배포·계정·비용·데이터 공유는 실행하지 마라.
```


## 4. 실패·중단·범위 변경 때 쓸 복구 프롬프트

아래는 해당 문제가 실제로 발생했을 때만 보낸다. 재시도 허용은 기존 작업·대상·권한 범위 안에서만 유효하다.

### R01. 테스트가 실패하거나 구현이 엉켰을 때

```text
화음 수리점의 현재 실패를 고쳐라. M00, docs/design.md의 관련 계약, docs/implementation-status.md, 마지막 실패 로그를 읽어라. 새 기능은 추가하지 않는다.
1. 현재 diff와 실패 명령을 보존하고 같은 실패를 최소 재현한다. 로그에 없는 원인을 사실로 단정하지 않는다.
2. 실패를 음악/콘텐츠/세션/UI/audio/저장/환경 중 어느 경계에서 발생하는지 분류한다. 가장 작은 회귀 테스트를 먼저 만든다.
3. 설계 계약을 지키는 최소 수정만 한다. target 데이터 변경, 검증 삭제, all-any, test.skip, 임의 timeout 증가로 숨기지 않는다.
4. 해당 테스트→연관 모듈→전체 필수 check를 순서대로 재실행한다. 접근 불가 기기/서비스는 미실행으로 기록한다.
5. 원인, 변경 파일, 재현 전후 명령/exit code, 남은 위험과 다음 단계 재개 가능 여부를 docs/handoffs/recovery-R01.md에 남겨라. 이미 승인된 범위를 벗어나는 권한이 필요하면 정확한 행동·대상을 설명하고 기다려라.
```

### R02. 대화·개발 도구·작업 환경이 바뀌었을 때

```text
기억에 의존하지 말고 화음 수리점 개발 상태를 복원하라. M00, docs/design.md, docs/promptpack.md, implementation-status, 최신 handoff, git status, package.json/lockfile, 실제 파일을 읽어라.
원본 SHA와 fixture reference 검증, typecheck, 최근 단계 테스트를 실행하라. 문서의 PASS를 현재 환경의 PASS로 자동 복사하지 않는다. 실제 코드와 보고가 다르면 차이를 먼저 기록한다. 사용자의 미커밋 변경을 되돌리지 않는다.
지금 완료된 단계/미완료 게이트/실제 다음 작업을 5줄 안으로 정리하고, 마지막으로 승인된 미완료 단계부터 재개하라. 모델·추론 설정은 실제 도구에서 확인 가능한 사실만 적는다. 배포/계정/연구 권한을 이전 문서의 예시에서 만들어내지 않는다.
```

### R03. 소리가 없거나 오래된 소리가 겹칠 때

```text
소리 문제만 진단하라. M00과 설계 10장, 현재 AudioService/transport/lifecycle, S05~S06 인계를 읽어라.
UI mute, master gain, 사용자 제스처, context state, pending resume, 현재 generation, 예약 source, voice 수, output 경로를 구분한다. 시스템 음량이나 사용자가 실제 들었는지는 코드만으로 확인했다고 하지 않는다.
같은 요청을 비교10연타/재생중음변경/hidden→return/closed→명시적재입력으로 재현한다. stale snapshot, 오래된 완료 callback, 취소된 future source가 남는지 테스트하라. 자동 재생 우회나 권한 확대를 하지 않는다.
수정 후 reference 음색/동일 gain·gate/타임라인을 다시 검증하고 실제 기기 청감 여부를 별도 보고하라. 실패가 계속되면 진행을 보존한 무음 경로와 정확한 메시지를 유지한다. docs/qa/mobile-audio.md에 기기·OS·브라우저·출력·재현·결과를 남겨라.
```

### R04. 저장이 손상되거나 두 탭에서 기록이 사라질 때

```text
저장 복구만 다뤄라. 사용자의 실제 DB를 자동 삭제하지 말고 우선 읽기/내보내기 가능한 기록과 backup을 보존하라. M00, 설계16장, storage-contract, 실패 로그를 읽어라.
transaction oncomplete/abort, global revision과 attempt revision, writer owner/lease, 늦은 debounce, completion idempotency를 확인한다. 현재 기록/이전 정상/구버전 증거 누락을 분리한다. hint/reveal/first submission을 false로 초기화하여 독립 성취를 만들어내지 마라.
시험은 격리된 테스트 DB에서 최소 재현한다. 새로 시작/교체 import는 범위를 밝힌 사용자 확인 전 실행하지 않는다. 복구 가능/불가능/unknown을 정직하게 표시하고 앱 작업은 memoryOnly로 계속한다.
수정 후 quota/손상/reload/두 탭/lease 인수/지원하지 않는 미래 버전을 회귀하고, 보존된 것·복구하지 못한 것·사용자가 결정할 것을 구체적으로 보고하라.
```

### R05. 음악 설명이나 판정이 틀렸다는 피드백을 받았을 때

```text
음악이론 문제를 원본 설계와 공식/학술 근거로 확인하라. 단순히 사용자의 지적을 부정하거나 불확실한 채 전부 바꾸지 않는다. 입력 표기, MIDI, 역할, 목표 화음, 음역, 전위 조건을 명시해 반례를 만들고 현재 결과를 재현한다.
C4=60, B#3=60, Cb4=59, 장[0,4,7]/단[0,3,7], 이명동음과 철자, exact 다중집합과 slot 순서, 기본 위치와 넓은 배치를 각각 점검하라. 검은건반 MIDI 입력과 철자 선택 과제는 분리한다.
실제 오류를 고칠 때는 unit fixture→콘텐츠 validator→UI 문구/오디오→저장 contentVersion 영향 순서로 수정한다. 원본 정답/학습목표를 바꿔야 하면 변경 이유와 영향, 기존 기록 처리안을 제시하고 승인 없이 다른 정답을 배포하지 마라. 수정 전후 테스트와 사용자에게 보여 줄 정확한 설명을 보고하라.
```

### R06. 예쁘게 꾸미라는 요청이 핵심 기능을 흔들 때

```text
현재 화음 수리점 UI를 개선하되 M00과 음악·오디오·평가·저장 계약은 그대로 유지하라. 현재 화면 screenshots, S09 접근성 결과, S10 자산 장부를 먼저 읽어라.
낮의 수리점, 종이 주문서, 명료한 실제 텍스트, 세 음 조각이라는 독립 방향 안에서 시각 계층·간격·대비·일관성을 개선한다. 다른 게임 화면/캐릭터/곡/로고를 베끼지 마라. 기능은 DOM이고 장식은 보조다.
정답 키 점멸/자동 힌트/목표 음 조기 공개/자동 큰 소리/확대 차단을 추가하지 않는다. 320px/400%/reduced motion/키보드/스크린리더와 초기전송예산을 전후 비교한다. 자산 권리·크기·출처를 기록하고, 기존 domain/E2E/audio 테스트가 그대로 통과하는지 보고하라.
```

### R07. 모든 기능을 한 번에 달라는 요청 또는 미정 사항이 생겼을 때

```text
새 요청이 현재 MVP 계약과 어떤 관계인지 분류하라. 8주문·정확한 판정·오디오·접근성·저장 복구·기본 합주는 유지한다. 전위 강좌/7화음/MIDI/마이크/계정/동기화/PWA/분석/결제는 별도 후속 범위다.
현재 요청에서 안전하게 독립 구현 가능한 부분과 기존 데이터·권한·일정에 영향을 주는 부분을 구분한다. 임의로 프로젝트를 전면 재작성하지 않는다. 필요한 결정만 작게 묻고 승인된 부분은 계속한다. 변경 요청서에는 바뀔 요구ID, 콘텐츠/저장 버전 영향, 추가 테스트, 권한/비용, 출시 차단을 적는다.
```

### R08. 공개 배포나 실기기 접근이 막혔을 때

```text
실제 연결/권한/도구 상태와 마지막 실패를 확인하라. 처음 한 방법이 실패했다는 이유로 모든 방법이 불가능하다고 단정하지 않는다. 하지만 거절된 접근을 다른 도구/계정으로 우회하지 마라.
배포 대상과 승인된 작업 범위를 명시하고 자격 증명·새 지속 접근·비용·공개 범위가 필요한 단계는 멈춘다. 허용된 read-only 진단/로컬 build/테스트/문서화는 계속한다. 공개 URL, 실기기 PASS, 안정성 수치를 지어내지 않는다.
사용자에게 필요한 최소 행동과 왜 필요한지, 현재까지 검증된 결과를 보고한다. 임시 미리보기/정식 출시/모바일 에뮬레이션/실기기 검증을 서로 바꿔 부르지 마라.
```

## 부록 A. 8개 주문의 정확한 기계 판독 기준

아래 JSON은 원본 설계 부록 A에서 그대로 복사했다. 모든 주문은 schemaVersion1/contentVersion1.0.0, 입력60~74, exact/기본위치/inversion0/철자선택평가 없음이다. 화면은 b/#를 ♭/♯로 바꾸지만 데이터 내용은 임의 수정하지 않는다. 첫 과정은 이 배열 순서이며 합주 순서는 별도다.

<!-- COPY_ORDER_FIXTURES_START -->
```json
[
  {
    "schemaVersion": 1,
    "contentVersion": "1.0.0",
    "id": "CR01",
    "title": "처음 맡긴 오르골",
    "root": "C4",
    "quality": "major",
    "initial": [
      "C4",
      "Eb4",
      "G4"
    ],
    "target": [
      "C4",
      "E4",
      "G4"
    ],
    "initialMidi": [
      60,
      63,
      67
    ],
    "targetMidi": [
      60,
      64,
      67
    ],
    "editableSlots": [
      1
    ],
    "allowedMidi": [
      60,
      74
    ],
    "registerMode": "exact",
    "spellingRequired": false,
    "inversion": 0,
    "primaryConcept": "major-third",
    "hintPolicy": "guided",
    "reflection": {
      "prompt": "바뀌지 않은 두 음은?",
      "options": [
        "C와 G",
        "C와 E",
        "E와 G"
      ],
      "answerIndex": 0
    },
    "displaySpellingMap": {
      "60": "C4",
      "61": "Db4",
      "62": "D4",
      "63": "Eb4",
      "64": "E4",
      "65": "F4",
      "66": "F#4",
      "67": "G4",
      "68": "Ab4",
      "69": "A4",
      "70": "Bb4",
      "71": "B4",
      "72": "C5",
      "73": "Db5",
      "74": "D5"
    }
  },
  {
    "schemaVersion": 1,
    "contentVersion": "1.0.0",
    "id": "CR02",
    "title": "반대로 고치기",
    "root": "C4",
    "quality": "minor",
    "initial": [
      "C4",
      "E4",
      "G4"
    ],
    "target": [
      "C4",
      "Eb4",
      "G4"
    ],
    "initialMidi": [
      60,
      64,
      67
    ],
    "targetMidi": [
      60,
      63,
      67
    ],
    "editableSlots": [
      1
    ],
    "allowedMidi": [
      60,
      74
    ],
    "registerMode": "exact",
    "spellingRequired": false,
    "inversion": 0,
    "primaryConcept": "minor-third",
    "hintPolicy": "guided",
    "reflection": {
      "prompt": "C에서 Eb까지는 몇 반음?",
      "options": [
        "3",
        "4",
        "7"
      ],
      "answerIndex": 0
    },
    "displaySpellingMap": {
      "60": "C4",
      "61": "Db4",
      "62": "D4",
      "63": "Eb4",
      "64": "E4",
      "65": "F4",
      "66": "F#4",
      "67": "G4",
      "68": "Ab4",
      "69": "A4",
      "70": "Bb4",
      "71": "B4",
      "72": "C5",
      "73": "Db5",
      "74": "D5"
    }
  },
  {
    "schemaVersion": 1,
    "contentVersion": "1.0.0",
    "id": "CR03",
    "title": "다른 근음에서도 같은 관계",
    "root": "F4",
    "quality": "major",
    "initial": [
      "F4",
      "Ab4",
      "C5"
    ],
    "target": [
      "F4",
      "A4",
      "C5"
    ],
    "initialMidi": [
      65,
      68,
      72
    ],
    "targetMidi": [
      65,
      69,
      72
    ],
    "editableSlots": [
      0,
      1,
      2
    ],
    "allowedMidi": [
      60,
      74
    ],
    "registerMode": "exact",
    "spellingRequired": false,
    "inversion": 0,
    "primaryConcept": "major-third",
    "hintPolicy": "optional",
    "reflection": {
      "prompt": "장3화음을 만들 때 유지되는 관계는?",
      "options": [
        "근음에서 3음 4반음",
        "항상 E를 넣기",
        "검은건반을 쓰지 않기"
      ],
      "answerIndex": 0
    },
    "displaySpellingMap": {
      "60": "C4",
      "61": "Db4",
      "62": "D4",
      "63": "Eb4",
      "64": "E4",
      "65": "F4",
      "66": "F#4",
      "67": "G4",
      "68": "Ab4",
      "69": "A4",
      "70": "Bb4",
      "71": "B4",
      "72": "C5",
      "73": "Db5",
      "74": "D5"
    }
  },
  {
    "schemaVersion": 1,
    "contentVersion": "1.0.0",
    "id": "CR04",
    "title": "검은건반과 음이름",
    "root": "G4",
    "quality": "minor",
    "initial": [
      "G4",
      "B4",
      "D5"
    ],
    "target": [
      "G4",
      "Bb4",
      "D5"
    ],
    "initialMidi": [
      67,
      71,
      74
    ],
    "targetMidi": [
      67,
      70,
      74
    ],
    "editableSlots": [
      0,
      1,
      2
    ],
    "allowedMidi": [
      60,
      74
    ],
    "registerMode": "exact",
    "spellingRequired": false,
    "inversion": 0,
    "primaryConcept": "minor-third",
    "hintPolicy": "optional",
    "reflection": {
      "prompt": "이번 화음의 3음은?",
      "options": [
        "G",
        "Bb",
        "D"
      ],
      "answerIndex": 1
    },
    "displaySpellingMap": {
      "60": "C4",
      "61": "Db4",
      "62": "D4",
      "63": "Eb4",
      "64": "E4",
      "65": "F4",
      "66": "F#4",
      "67": "G4",
      "68": "Ab4",
      "69": "A4",
      "70": "Bb4",
      "71": "B4",
      "72": "C5",
      "73": "Db5",
      "74": "D5"
    }
  },
  {
    "schemaVersion": 1,
    "contentVersion": "1.0.0",
    "id": "CR05",
    "title": "도움 없는 장3화음 확인",
    "root": "G4",
    "quality": "major",
    "initial": [
      "G4",
      "Bb4",
      "D5"
    ],
    "target": [
      "G4",
      "B4",
      "D5"
    ],
    "initialMidi": [
      67,
      70,
      74
    ],
    "targetMidi": [
      67,
      71,
      74
    ],
    "editableSlots": [
      0,
      1,
      2
    ],
    "allowedMidi": [
      60,
      74
    ],
    "registerMode": "exact",
    "spellingRequired": false,
    "inversion": 0,
    "primaryConcept": "major-third",
    "hintPolicy": "optional",
    "reflection": {
      "prompt": "G 단3화음과 비교해 무엇이 달라졌나요?",
      "options": [
        "3음이 반음 높아짐",
        "근음이 바뀜",
        "5음이 반음 낮아짐"
      ],
      "answerIndex": 0
    },
    "displaySpellingMap": {
      "60": "C4",
      "61": "Db4",
      "62": "D4",
      "63": "Eb4",
      "64": "E4",
      "65": "F4",
      "66": "F#4",
      "67": "G4",
      "68": "Ab4",
      "69": "A4",
      "70": "Bb4",
      "71": "B4",
      "72": "C5",
      "73": "Db5",
      "74": "D5"
    }
  },
  {
    "schemaVersion": 1,
    "contentVersion": "1.0.0",
    "id": "CR06",
    "title": "도움 없는 단3화음 확인",
    "root": "F4",
    "quality": "minor",
    "initial": [
      "F4",
      "A4",
      "C5"
    ],
    "target": [
      "F4",
      "Ab4",
      "C5"
    ],
    "initialMidi": [
      65,
      69,
      72
    ],
    "targetMidi": [
      65,
      68,
      72
    ],
    "editableSlots": [
      0,
      1,
      2
    ],
    "allowedMidi": [
      60,
      74
    ],
    "registerMode": "exact",
    "spellingRequired": false,
    "inversion": 0,
    "primaryConcept": "minor-third",
    "hintPolicy": "optional",
    "reflection": {
      "prompt": "F→Ab, F→C의 반음 수는?",
      "options": [
        "3과 7",
        "4와 7",
        "3과 6"
      ],
      "answerIndex": 0
    },
    "displaySpellingMap": {
      "60": "C4",
      "61": "Db4",
      "62": "D4",
      "63": "Eb4",
      "64": "E4",
      "65": "F4",
      "66": "F#4",
      "67": "G4",
      "68": "Ab4",
      "69": "A4",
      "70": "Bb4",
      "71": "B4",
      "72": "C5",
      "73": "Db5",
      "74": "D5"
    }
  },
  {
    "schemaVersion": 1,
    "contentVersion": "1.0.0",
    "id": "CR07",
    "title": "가운데 음만 고치지 않기",
    "root": "C4",
    "quality": "major",
    "initial": [
      "C4",
      "E4",
      "F#4"
    ],
    "target": [
      "C4",
      "E4",
      "G4"
    ],
    "initialMidi": [
      60,
      64,
      66
    ],
    "targetMidi": [
      60,
      64,
      67
    ],
    "editableSlots": [
      0,
      1,
      2
    ],
    "allowedMidi": [
      60,
      74
    ],
    "registerMode": "exact",
    "spellingRequired": false,
    "inversion": 0,
    "primaryConcept": "fifth",
    "hintPolicy": "optional",
    "reflection": {
      "prompt": "장·단3화음에서 근음과 5음의 간격은?",
      "options": [
        "7반음",
        "3반음",
        "4반음"
      ],
      "answerIndex": 0
    },
    "displaySpellingMap": {
      "60": "C4",
      "61": "Db4",
      "62": "D4",
      "63": "Eb4",
      "64": "E4",
      "65": "F4",
      "66": "F#4",
      "67": "G4",
      "68": "Ab4",
      "69": "A4",
      "70": "Bb4",
      "71": "B4",
      "72": "C5",
      "73": "Db5",
      "74": "D5"
    }
  },
  {
    "schemaVersion": 1,
    "contentVersion": "1.0.0",
    "id": "CR08",
    "title": "주문의 근음 확인",
    "root": "F4",
    "quality": "minor",
    "initial": [
      "E4",
      "Ab4",
      "C5"
    ],
    "target": [
      "F4",
      "Ab4",
      "C5"
    ],
    "initialMidi": [
      64,
      68,
      72
    ],
    "targetMidi": [
      65,
      68,
      72
    ],
    "editableSlots": [
      0,
      1,
      2
    ],
    "allowedMidi": [
      60,
      74
    ],
    "registerMode": "exact",
    "spellingRequired": false,
    "inversion": 0,
    "primaryConcept": "root",
    "hintPolicy": "optional",
    "reflection": {
      "prompt": "F단3화음의 근음과 3음은?",
      "options": [
        "F와 Ab",
        "Ab와 C",
        "E와 Ab"
      ],
      "answerIndex": 0
    },
    "displaySpellingMap": {
      "60": "C4",
      "61": "Db4",
      "62": "D4",
      "63": "Eb4",
      "64": "E4",
      "65": "F4",
      "66": "F#4",
      "67": "G4",
      "68": "Ab4",
      "69": "A4",
      "70": "Bb4",
      "71": "B4",
      "72": "C5",
      "73": "Db5",
      "74": "D5"
    }
  }
]
```
<!-- COPY_ORDER_FIXTURES_END -->

## 부록 B. 바로 실행할 수 있는 독립 기준 데이터 검증기

아래 블록을 `scripts/verify-reference.mjs`로 저장한다. Node의 내장 모듈만 사용하며 게임을 구현하지 않는다. 원본 설계와 JSON 파일의 동일성·음고·철자·도달성·합주 경계를 확인한다. 이를 통과했다는 것은 **기준 데이터가 일치한다는 뜻**이며 게임의 UI/grade/오디오/저장 코드가 통과했다는 뜻이 아니다.

S00에서 실행할 명령:

```bash
node scripts/verify-reference.mjs docs/design.md src/content/orders.v1.json
```

아직 JSON을 추출하지 않았다면 아래 명령을 먼저 실행한다. 파일이 이미 있으면 덮어쓰지 않고 멈춘다.

```bash
node --input-type=module - <<'JS'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const text = readFileSync('docs/design.md', 'utf8');
const match = text.match(/<!-- ORDER_FIXTURES_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- ORDER_FIXTURES_END -->/);
if (!match) throw new Error('설계서의 주문 JSON 경계를 찾지 못했습니다.');
const orders = JSON.parse(match[1]);
mkdirSync('src/content', { recursive: true });
writeFileSync('src/content/orders.v1.json', JSON.stringify(orders, null, 2) + '\n', { flag: 'wx' });
console.log('EXTRACTED', orders.length, 'orders');
JS
```

### B.1 검증기 전체 코드

<!-- REFERENCE_VERIFIER_START -->
```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [designPath, jsonPath] = process.argv.slice(2);
assert.ok(designPath && jsonPath,
  'Usage: node scripts/verify-reference.mjs docs/design.md src/content/orders.v1.json');
const designBytes = readFileSync(designPath);
const match = designBytes.toString('utf8').match(
  /<!-- ORDER_FIXTURES_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- ORDER_FIXTURES_END -->/
);
assert.ok(match, 'ORDER_FIXTURES block missing');
const reference = JSON.parse(match[1]);
const actual = JSON.parse(readFileSync(jsonPath, 'utf8'));
assert.deepEqual(actual, reference, 'Extracted content differs from design');

const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = 'CDEFGAB';
const mod = n => ((n % 12) + 12) % 12;
const midi = spelling => {
  const m = /^([A-G])(bb|##|b|#)?(-?\d+)$/.exec(spelling);
  assert.ok(m, `Invalid spelling: ${spelling}`);
  const accidental = m[2] === 'bb' ? -2 : m[2] === 'b' ? -1
    : m[2] === '#' ? 1 : m[2] === '##' ? 2 : 0;
  const value = 12 * (Number(m[3]) + 1) + NATURAL[m[1]] + accidental;
  assert.ok(Number.isInteger(value) && value >= 0 && value <= 127);
  return value;
};
const triad = (root, quality) => {
  const m = /^([A-G])(bb|##|b|#)?(-?\d+)$/.exec(root);
  assert.ok(m);
  const rootMidi = midi(root), rootIndex = LETTERS.indexOf(m[1]);
  const offsets = quality === 'major' ? [0, 4, 7] : [0, 3, 7];
  return [0, 2, 4].map((step, i) => {
    const letter = LETTERS[(rootIndex + step) % 7];
    const octave = Number(m[3]) + Math.floor((rootIndex + step) / 7);
    const accidental = rootMidi + offsets[i] - (12 * (octave + 1) + NATURAL[letter]);
    assert.ok(accidental >= -2 && accidental <= 2);
    const sign = accidental < 0 ? 'b'.repeat(-accidental) : '#'.repeat(accidental);
    return `${letter}${sign}${octave}`;
  });
};
const sort = xs => [...xs].sort((a, b) => a - b);
const fields = [
  'schemaVersion', 'contentVersion', 'id', 'title', 'root', 'quality',
  'initial', 'target', 'initialMidi', 'targetMidi', 'editableSlots',
  'allowedMidi', 'registerMode', 'spellingRequired', 'inversion',
  'primaryConcept', 'hintPolicy', 'reflection', 'displaySpellingMap'
].sort();
const expected = [
  ['CR01', 'C4', 'major', [60, 63, 67], [60, 64, 67], 'major-third', 0],
  ['CR02', 'C4', 'minor', [60, 64, 67], [60, 63, 67], 'minor-third', 0],
  ['CR03', 'F4', 'major', [65, 68, 72], [65, 69, 72], 'major-third', 0],
  ['CR04', 'G4', 'minor', [67, 71, 74], [67, 70, 74], 'minor-third', 1],
  ['CR05', 'G4', 'major', [67, 70, 74], [67, 71, 74], 'major-third', 0],
  ['CR06', 'F4', 'minor', [65, 69, 72], [65, 68, 72], 'minor-third', 0],
  ['CR07', 'C4', 'major', [60, 64, 66], [60, 64, 67], 'fifth', 0],
  ['CR08', 'F4', 'minor', [64, 68, 72], [65, 68, 72], 'root', 0]
];
function verifyOrders(orders) {
  assert.equal(orders.length, 8);
  assert.equal(new Set(orders.map(o => o.id)).size, 8);
  orders.forEach((o, i) => {
    const e = expected[i];
    assert.deepEqual(Object.keys(o).sort(), fields);
    assert.equal(o.schemaVersion, 1);
    assert.equal(o.contentVersion, '1.0.0');
    assert.equal(o.id, e[0]); assert.equal(o.root, e[1]); assert.equal(o.quality, e[2]);
    assert.deepEqual(o.initialMidi, e[3]); assert.deepEqual(o.targetMidi, e[4]);
    assert.equal(o.primaryConcept, e[5]);
    assert.equal(o.reflection.answerIndex, e[6]);
    assert.equal(o.initial.length, 3); assert.equal(o.target.length, 3);
    assert.deepEqual(o.initial.map(midi), o.initialMidi);
    assert.deepEqual(o.target.map(midi), o.targetMidi);
    assert.deepEqual(o.target, triad(o.root, o.quality));
    const offsets = o.quality === 'major' ? [0, 4, 7] : [0, 3, 7];
    assert.deepEqual(o.targetMidi.map(n => n - midi(o.root)), offsets);
    assert.deepEqual(o.allowedMidi, [60, 74]);
    assert.equal(o.registerMode, 'exact'); assert.equal(o.spellingRequired, false);
    assert.equal(o.inversion, 0);
    assert.equal(o.hintPolicy, i < 2 ? 'guided' : 'optional');
    assert.deepEqual(o.editableSlots, i < 2 ? [1] : [0, 1, 2]);
    assert.notDeepEqual(sort(o.initialMidi), sort(o.targetMidi));
    for (let slot = 0; slot < 3; slot++) {
      assert.ok(o.initialMidi[slot] >= 60 && o.initialMidi[slot] <= 74);
      assert.ok(o.targetMidi[slot] >= 60 && o.targetMidi[slot] <= 74);
      if (!o.editableSlots.includes(slot)) assert.equal(o.initialMidi[slot], o.targetMidi[slot]);
    }
    assert.deepEqual(Object.keys(o.displaySpellingMap).map(Number).sort((a,b) => a-b),
      Array.from({ length: 15 }, (_, n) => n + 60));
    for (const [key, value] of Object.entries(o.displaySpellingMap)) assert.equal(midi(value), Number(key));
    assert.deepEqual(Object.keys(o.reflection).sort(), ['answerIndex', 'options', 'prompt']);
    assert.equal(o.reflection.options.length, 3);
    assert.ok(Number.isInteger(o.reflection.answerIndex) && o.reflection.answerIndex >= 0 && o.reflection.answerIndex < 3);
    assert.ok(o.title.length > 0 && o.reflection.prompt.length > 0);
    assert.ok(o.reflection.options.every(x => typeof x === 'string' && x.length > 0));
    assert.equal(Math.min(...o.targetMidi), midi(o.root));
  });
}
verifyOrders(actual);
assert.equal(midi('B#3'), 60); assert.equal(midi('Cb4'), 59);
assert.equal(midi('D#4'), midi('Eb4'));
assert.equal(440 * 2 ** ((69 - 69) / 12), 440);
assert.deepEqual(sort([64, 67, 72].map(mod)), sort([60, 64, 67].map(mod)));
assert.notDeepEqual(sort([60, 64, 64].map(mod)), sort([60, 64, 67].map(mod)));

// Negative controls: the verifier must reject intentional corruptions.
for (const mutate of [
  xs => { xs[0].targetMidi[1] = 65; },
  xs => { xs[3].target[1] = 'A#4'; },
  xs => { delete xs[0].displaySpellingMap['74']; },
  xs => { xs[0].editableSlots = []; },
  xs => { xs[7].reflection.answerIndex = 2; }
]) {
  const clone = structuredClone(actual); mutate(clone);
  assert.throws(() => verifyOrders(clone));
}

// Reference ensemble arithmetic only; the app's exported event builder needs its own tests.
const orderIds = ['CR01','CR02','CR03','CR06','CR05','CR04','CR08','CR07'];
const beat = 60 / 80, bar = 4 * beat, release = 0.12;
const byId = new Map(actual.map(o => [o.id, o]));
const events = [];
const pattern = [[0, 0, 1.4], [0, 2, 1.4], [1, 1, 0.8], [1, 3, 0.8],
  [2, 0.5, 0.3], [2, 1.5, 0.3], [2, 2.5, 0.3], [2, 3.5, 0.3]];
orderIds.forEach((orderId, barIndex) => {
  const notes = byId.get(orderId).targetMidi;
  const rows = barIndex === 7 ? [[0,0,3.5],[1,0,3.5],[2,0,3.5]] : pattern;
  for (const [roleIndex, offset, duration] of rows) {
    const at = barIndex * bar + offset * beat;
    const gateEnd = at + duration * beat;
    const audibleEnd = gateEnd + release;
    assert.ok(audibleEnd <= (barIndex + 1) * bar - 0.01 + 1e-9);
    events.push({ orderId, barIndex, roleIndex, midi: notes[roleIndex], at, gateEnd, audibleEnd });
  }
});
assert.equal(events.length, 59); assert.equal(8 * bar, 24);
const finalFifth = events.find(e => e.barIndex === 0 && e.at === 3.5 * beat);
assert.ok(Math.abs(bar - finalFifth.audibleEnd - 0.03) < 1e-9);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
console.log(JSON.stringify({
  status: 'REFERENCE_DATA_PASS', orders: actual.length, ensembleEvents: events.length,
  contentVersion: '1.0.0', bodySeconds: 24, transportEndSeconds: 24.4,
  designSha256: hash(designBytes), extractedJsonSha256: hash(readFileSync(jsonPath)),
  scope: 'Reference content/math only. Game implementation, device audio, accessibility, storage and learning outcomes NOT tested.'
}, null, 2));
```
<!-- REFERENCE_VERIFIER_END -->

### B.2 구현 뒤 반드시 추가할 테스트 인터페이스

위 검증기로 실제 판정 함수를 대신하지 않는다. S01~S02는 아래 public API를 실제 구현하고 그 함수들을 직접 호출하는 테스트를 만든다. 경로/이름 변경이 필요하면 API 매핑과 모든 소비자 테스트를 함께 바꾼다.

```ts
// API의 형태를 합의하는 계약이다. 이 블록 자체는 실행 완료된 구현이 아니다.
declare function parseSpelledPitch(text: string): SpelledPitch;
declare function toMidi(pitch: SpelledPitch): number;
declare function midiToFrequency(midi: number): number;
declare function generateTriad(root: SpelledPitch, quality: Quality): readonly [SpelledPitch, SpelledPitch, SpelledPitch];
declare function spellForTask(midi: number, root: SpelledPitch, quality: Quality,
  displayMap: Readonly<Record<number, SpelledPitch>>): SpelledPitch;
declare function grade(slots: readonly VoiceSlot[], target: ChordTarget): Grade;
```

테스트 작성 지시:

- `makeTarget`은 정규 화음을 생성해 requiredMidi/requiredSpelling을 만들고 registerMode/inversion/spellingRequired를 명시하는 테스트 helper다. 기본 mode는 exact/inversion0/false다.
- `slots` helper는 고유한 물리 ID 세 개를 부여한다. malformed ID/빈 슬롯 테스트는 직접 배열로 만든다.
- expected 값을 동일 production 함수 결과로 계산해서만 비교하지 않는다. C/F/G·이명동음 반례는 고정 literal oracle을 둔다.
- 오디오 UI E2E에서 mock은 context 정책/예약을 보조 검증하는 용도다. 실제 소리와 모바일 OS 중단 검사는 별도다.
- 게임의 `buildEnsembleEvents()`가 반환한 59개 event를 부록 B 산술 oracle과 대조한다. 기준 스크립트만 두 번 돌리는 것은 구현 검사가 아니다.

## 부록 C. 요구사항 추적표

구현 때 마지막 세 열 `파일 / 테스트·검사 ID / 상태·증거`를 실제 값으로 채운다. 아래는 요구사항 배치이며 현재 게임 테스트 통과표가 아니다.

| ID | 보존할 요구사항 | 원본 | 책임 단계 | 핵심 확인 |
|---|---|---|---|---|
| REQ01 | 독립 이름·아트·DB namespace, 다른 게임과 분리 | 1 | S00/S10/S13 | 앱/DB/자산 장부 |
| REQ02 | C/F/G 장단, 8주문, 60~74, 후속 범위 분리 | 0/5/22 | S00/S02/S07 | fixture 및 scope |
| REQ03 | 정규 철자·B#3/Cb4·음고/음고류 구분 | 4.1/4.3/13.4 | S01/S02 | MUS01~06 |
| REQ04 | 근음/3음/5음, 장단 음정, 조성과 화음 구분 | 4.2/4.4 | S01/S07 | literal oracle/문구 검수 |
| REQ05 | exact 다중집합·전위·넓은 배치·철자 분리 | 4.5~4.6 | S02 | MUS07~14 |
| REQ06 | 앱 오류/빈 슬롯/오답/정답 및 원인 코드 분리 | 4.6/13.3 | S02 | negative fixtures |
| REQ07 | 8 JSON/정답/문항/map/도달성 엄격 검증 | 15/부록 A | S00/S02 | reference/content build failure |
| REQ08 | 2주문 제한 편집→모든 역할 탐색 | 5 | S04/S07 | CR07/08 직접 수정 |
| REQ09 | 도움3단계·시범snapshot·감점 없음 | 3/6 | S03/S07 | assisted 흐름 |
| REQ10 | 질문 먼저/해설 뒤, 노출이력 보존 | 3/12/14 | S03/S07/S08 | LEARN01~08 |
| REQ11 | 무음·접근성 옵션은 힌트 아님 | 2/8/12 | S04/S07/S09 | mute/AT evidence 불변 |
| REQ12 | 탭 확정/pointercancel/preview auto-stop | 7 | S04/S05/S06 | INPUT01~05 |
| REQ13 | 큰버튼·피아노·키보드 동일 경로 | 7 | S04/S09 | 입력 동등성 |
| REQ14 | 작은화면/확대/대비/focus/AT | 8 | S04/S09/S11 | A11Y01~06 |
| REQ15 | 단일context·동일 비교 음색·주파수/envelope | 9~10 | S05/S06 | AUDIO01~04 |
| REQ16 | 비교snapshot·generation·hidden/return | 10/14 | S06 | AUDIO05~10 |
| REQ17 | voice24·늦은event 정지·지연지표 구분 | 10/18 | S05/S06/S11 | 폭주/성능 |
| REQ18 | 8마디 교대합주·gate/release·solo/mute | 11 | S10 | ENS01~05 |
| REQ19 | 독립 state axes·4식별값 stale·멱등 완료 | 14 | S03/S08 | STATE01~07 |
| REQ20 | IDB 원자 저장·300ms/max1s·즉시 증거 | 16 | S08 | STORE01~06 |
| REQ21 | 손상/backup/unknown/memoryOnly/import | 16 | S08 | STORE07~12 |
| REQ22 | 두 탭revision/lease/인수/충돌 방어 | 16.4 | S08 | STORE13~15 |
| REQ23 | 자유 실험 평가 없음·재방문·동일 보상 | 3/8 | S07/S10 | SANDBOX01/보상 |
| REQ24 | 성능예산·20분 누수·실기기 증거 | 17~18 | S11 | PERF01~05 |
| REQ25 | 무계정/무분석/권한 최소화/외부 자산 권리 | 19 | S00/S10/S11 | SEC01~05 |
| REQ26 | 플레이/개념/전이 분리·효과 과장 금지 | 12 | S07/S12/S13 | 연구/문구 감사 |
| REQ27 | 로드 후 offline 가능, PWA는 후속 | 21 | S11/S14 | offline session |
| REQ28 | 출시 차단·실행/미실행 구분·별도 공개 승인 | 20/24 | S11/S13/S14 | 인수인계/승인 근거 |

## 부록 D. 최소 회귀 매트릭스와 정확한 기대값

`자동`은 테스트를 만들어 실제 실행할 때만 PASS가 된다. `실기기/수동`은 도구 접근·기기·사용자 조작이 필요한 검사다. 이 표 자체는 검증 결과가 아니다.

### D.1 음악·콘텐츠

| ID | 입력/상황 | 기대 |
|---|---|---|
| MUS01 | C4/Eb4/E4/G4 | MIDI 60/63/64/67 |
| MUS02 | B#3/C4 및 Cb4/B3 | 각각 MIDI 60/59, 표기는 다름 |
| MUS03 | C4→Eb4 vs C4→D#4 | 모두 3반음이나 문자 3도/2도 구분 |
| MUS04 | root C4/F4/G4, major/minor | [0,4,7]/[0,3,7], 정규 문자 철자 |
| MUS05 | MIDI 63 건반, C minor 문맥 | Eb4 표기, 철자 선택 오답 없음 |
| MUS06 | MIDI 70 건반, G minor 문맥 | Bb4 표기; A#4 보조 이름 허용 |
| MUS07 | [60,63,67]→C major exact | incorrect, THIRD_MISMATCH |
| MUS08 | [60,64,67]의 6순열→C major exact | 모두 correct; 입력 배열 불변 |
| MUS09 | [60,64,64]→C major | fifth 누락, correct 아님 |
| MUS10 | E4 G4 C5, pitch-class, inversion1/0/null | correct / INVERSION_MISMATCH / correct |
| MUS11 | C4 G4 E5, pitch-class, inversion0 | correct, 기본 위치·넓은 배치 |
| MUS12 | C3 E3 G3→C4 E4 G4 exact | pitchClassCorrect=true, REGISTER_MISMATCH |
| MUS13 | C4 D#4 G4→C minor, spellingRequired=true | SPELLING_MISMATCH; false이면 철자만으로 실패 안 함 |
| MUS14 | 구성음 불일치 상태의 전위 분석 | inversionCorrect=false, MEMBERS_MISMATCH, 가짜 전위명 없음 |
| DATA01 | 8 target/8 initial | 모두 correct/모두 incorrect |
| DATA02 | CR01~02 editableSlots, CR03~08 | [1], [0,1,2] |
| DATA03 | 누락 map/틀린 MIDI/잘못된 enum/추가 필드 | 콘텐츠 거절 및 build 실패 |
| DATA04 | NaN/Infinity/중복 slot ID/잘못된 pitch | invalid, 사용자 오답 집계 안 함 |
| DATA05 | null slot vs 슬롯 개수 오류 | incomplete vs invalid 구분 |
| DATA06 | 잠긴 음 변경해야 target 도달/허용 범위 밖 | validator 거절 |
| DATA07 | question answer index 및 shuffle | CR04만 원본 index 1, 나머지 0; 섞인 stableID로 판정 |

### D.2 상태·학습

| ID | 시나리오 | 기대 |
|---|---|---|
| STATE01 | 다른 orderId지만 같은 revision 결과 | 폐기 |
| STATE02 | attempt/revision/submission 각각 다른 응답 | 하나라도 다르면 폐기 |
| STATE03 | 중복 CHECK/GRADE_READY/CONTINUE | 제출/완료 멱등, 중복 악기 없음 |
| STATE04 | 같은 음 반복 선택 | revision/undo 증가 없음 |
| STATE05 | 51회 변화→undo/주문 전환 | 최근 50개만, 전환하면 undo 정리 |
| STATE06 | 첫 오답→undo/reset→정답 | 최초 오답 유지, finalSuccess만 변경 |
| STATE07 | reload/복귀 vs 새 연습 | 기존 attemptId 유지 / 새 attemptId |
| LEARN01 | 수리 정답 직후 | 짧은 성공만, 관계 정답/상세 해설 비공개 |
| LEARN02 | 질문의 첫 답변/skip | explanation으로, skip도 완료 가능 |
| LEARN03 | 해설 먼저 보기/정답 시범/답 노출 튜토리얼 | reveal=true, 해당 독립 성취 제외 |
| LEARN04 | hint→undo→reset→reload | 최대 도움/노출 이력 감소 없음 |
| LEARN05 | 질문오답, 수리 도움, mute | 악기/합주 보상 유지 |
| LEARN06 | 큰버튼/VoiceOver/TalkBack/reducedmotion | hint로 집계 안 함 |
| LEARN07 | CR05/06/07/08 첫 화면 | 자동 정답 힌트/수정 slot 강조 없음 |
| LEARN08 | 100개seed/새로고침 | 정답 stable ID 보존, 실제 DOM 순서와 일치 |

### D.3 입력·오디오

| ID | 시나리오 | 기대 |
|---|---|---|
| INPUT01 | pointerdown→scroll→pointercancel | 음 교체0, preview 유한 |
| INPUT02 | pointerdown→up→click | 음 교체1, 중복revision 없음 |
| INPUT03 | blur/lostpointercapture/pagehide | 지속음 없음, active gesture 정리 |
| INPUT04 | Enter/Space/arrow/Escape | 동등 입력, focus복귀, 키 반복 통제 |
| INPUT05 | pinch/수평스크롤/세로스크롤 | 브라우저 확대 허용, 의도치 않은 확정 방지 |
| AUDIO01 | 첫 방문·locked·mute | 자동 소리 0회, 사용자 입력에서 unlock |
| AUDIO02 | A4/15음 | 440Hz 및 수식일치 |
| AUDIO03 | reference 비교 | 동일 timbre/gain/velocity/gate, 3음 동시 시작 |
| AUDIO04 | 비교 시각 | .05/.95/1.35/2.25/2.40, release .12 |
| AUDIO05 | 비교 중 edit/undo/reset | old generation 취소, stale 두 번째 화음 0회 |
| AUDIO06 | 10연타/25번째 voice | 마지막 요청만, musical voice<=24 |
| AUDIO07 | hidden/pagehide→return | stop/suspend 시도, 복귀 자동 재생 0회 |
| AUDIO08 | pending resume 취소/closed/interrupted | stale 요청 폐기, 명시적 재입력에서만 재개 |
| AUDIO09 | scheduler 지연/rAF 지연 | 늦은 음 몰아 재생 0회, 오디오 시계 독립 |
| AUDIO10 | 전화/잠금/출력 전환/Bluetooth/저전력 | 실제 기기별 확인, 세션 보존 |
| AUDIO11 | unsupported/합성 실패/resume 거절 | sine fallback 1회 또는 무음, 학습 유지 |
| AUDIO12 | OfflineAudioContext peak | 측정 peak<=-1dBFS목표; 음압 안전/실기기 검증 대체 아님 |

### D.4 저장·합주·접근성·보안

| ID | 시나리오 | 기대 |
|---|---|---|
| STORE01 | edit debounce | 300ms, 연속 입력 maxWait1초 |
| STORE02 | HINT/CHECK/ANSWER/REVEAL/SKIP | 증거+draft 즉시 transaction |
| STORE03 | complete/write abort | progress+attempt+draft 정리 원자성 |
| STORE04 | 늦은 낮은 revision write | 최신값 덮어쓰기 차단 |
| STORE05 | 질문/해설각단계 reload | 단계·shuffle·first/hint/reveal 보존 |
| STORE06 | quota/security denied | memoryOnly/배너/export, 플레이 유지 |
| STORE07 | 손상된 current·정상 backup | 자동 삭제 없이 복구 선택 |
| STORE08 | 증거가 빠진 구버전 | evidenceStatus=unknown |
| STORE09 | 미래 버전 import | 구체적인 거절, 현재 기록 유지 |
| STORE10 | import >256KB/과대 배열/악성 키 | 읽기 전 크기 검사+엄격 검증, 실행 0회 |
| STORE11 | import 취소/확정 | 변경 0회 / backup 후 원자적 교체 |
| STORE12 | 상세 시도>100/export 크기 | summary 보존, 첫 증거 소실 없음 |
| STORE13 | 두 탭 동시 수정 | writer/revision 충돌 검사, 알림 없는 덮어쓰기 0회 |
| STORE14 | 편집 탭 crash/lease 만료/인수 | 영구 잠금 없음, 명시적 인수 |
| STORE15 | BroadcastChannel 미지원 | transaction 충돌 검사가 여전히 작동 |
| ENS01 | 8마디 순서 | CR01,02,03,06,05,04,08,07 |
| ENS02 | event 수/본문/transport | 59개/24초/24.4초 |
| ENS03 | 모든 gate+release | 다음 마디 시작 10ms 이전 종료,마지막 fifth 30ms 여유 |
| ENS04 | 전체/solo/mute/stop/hidden | 해당 파트만, 완전한 취소, auto loop 0회 |
| ENS05 | 8개 고유 완료·질문 skip | 해금, 반복 완료의 중복 보상 0회 |
| SANDBOX01 | 자유 실험 출입/수정 | 평가/progress 불변, transport 정리 |
| A11Y01 | keyboard+focus | 모든 핵심 행동, panel 종료 시 slot 복귀 |
| A11Y02 | VoiceOver/TalkBack | 8수리·결과·설정·export 가능, 시험하지 않았다면 미확인 |
| A11Y03 | 320px/200%/400%/가로 | 본문 가로 overflow 0,피아노 내부는 별도 |
| A11Y04 | contrast/selected/locked | 4.5:1/3:1 기준,색 외 정보 |
| A11Y05 | reducedmotion/mute/live | 정적 대체,자동 소리 없음,변경 1회 안내 |
| A11Y06 | touch target | 일반 44px 목표/NotePad 48px,black 36px 및 동등한 대체 경로 |
| PERF01 | production 초기 JS gzip/전체 전송/자산 | <=250KB/1.5MB/5MB목표 |
| PERF02 | 첫 의미 있는 화면 | 재현 조건에서 2.5초 목표 |
| PERF03 | tap→paint/tap→schedule | p95<=100ms/30ms목표 |
| PERF04 | tap→실제 스피커 | 외부 실측 내장·유선p95<=100ms목표,Bluetooth 별도 |
| PERF05 | 20분 반복 | heap/voice/listener지속 증가 없음 |
| SEC01 | 콘텐츠/로컬import | HTML실행 0회,외부JSON실행 0회,엄격 schema |
| SEC02 | network/permissions | analytics/account/마이크/카메라/위치 요청 0회 |
| SEC03 | asset/dependency 장부 | 출처·버전·권리·해시 근거 |
| SEC04 | 로그/내보내기 | 비밀/개인식별/오디오 buffer/디바이스 ID 없음 |
| SEC05 | 배포·PWA | 추가 승인 없이 공개 0회,SW 자동 추가 0회 |
| OFFLINE01 | 최초 로드 뒤 연결 끊김 | 현재 세션의 수리·합주·저장 계속; 재실행 보장 아님 |

## 부록 E. 실행 결과와 인계에 사용할 템플릿

### E.1 단계 실행 기록

```markdown
# Sxx 실행 결과
- 상태: PASS / PARTIAL / BLOCKED
- 실행일·시간대:
- 실제 환경/OS/Node/package manager/브라우저 버전:
- 원본/콘텐츠 버전과 hash:
- 현재 변경 범위 및 보존한 사용자 변경:

## 구현한 사용자 행동
- 실제 가능한 흐름:
- 변경 파일과 요구사항 ID:
- 구현 선택/원본과의 차이 및 승인 여부:

## 실행 증거
| 명령 또는 수동 절차 | 종료코드/결과 | 실제 테스트 수 | 로그/trace/screenshot |
|---|---|---|---|

## 미실행/차단
- 무엇을 못 했는가:
- 이유와 영향:
- 필요한 기기/권한/사용자 결정:

## 다음 단계 인계
- 읽을 파일:
- 유지할 계약:
- 해결된 결함과 남은 위험:
- 다음에 먼저 할 한 가지:
```

### E.2 실기기 기록

```markdown
- 기기 모델 / OS / 브라우저 정확 버전 / AT 버전:
- 출력: 내장 / 유선 / Bluetooth (모델·연결 조건은 필요한 최소한만)
- 실제 검사자 / 날짜 / build releaseId:
- 검사: unlock, mute, compare, 연타, edit 취소, hidden, 복귀, 전화/미디어, 잠금, 출력 전환, 저전력
- 재현 단계:
- 관찰 결과: PASS / FAIL / NOT RUN / INCONCLUSIVE
- 자동화가 확인한 것:
- 실제로 들으며 확인한 것:
- 외부 장비로 측정한 지연: 값 또는 미측정
- 저장/입력/접근성에 미친 영향:
- 증거 경로와 수정 후 재시험:
```

### E.3 출시 후보 판단

```markdown
- 후보 releaseId / 앱 버전 / contentVersion / artifact SHA-256:
- 원본24장 체크리스트 상태:
- 실제 지원 확인 기기·브라우저:
- 음악/콘텐츠/오디오/상태/저장/접근성/보안/성능/권리 결과:
- 사용성 관찰 실시 여부, 범위와 한계:
- 교육효과: 검증하지 않음 또는 실제 연구 근거만
- 공개 여부: 미배포 / 승인된 미리보기 / 승인된 공개
- 남은 출시 차단:
- 알려진 한계와 복구 방법:
- 배포 승인 대상과 범위: 없으면 없음
```

## 부록 F. 기술 선택과 공식 출처의 고정 가정

작성일 2026-10-19에 다음 1차 문서를 다시 확인했다. 소프트웨어 버전·지원 브라우저는 개발 시작일에 다시 확인한다. 이 팩은 미검증된 특정 최신 패키지 조합을 고정 설치하도록 요구하지 않는다. **S00에서 호환되는 실제 안정 버전을 선택하여 package.json/lockfile/toolchain 문서에 exact pin**하는 절차가 고정 계약이다.

- [Vite Getting Started](https://vite.dev/guide/): 정적 앱 개발·production build 기반. 조회 시 Node20.19+ 또는22.12+ 요구가 제시되어 있었다. 다른 도구의 더 높은 요구까지 함께 만족해야 한다.
- [Vitest Getting Started](https://vitest.dev/guide/): 조회 시 Vite>=6.4.0, Node>=22.12.0 요구가 제시되어 있었다. 이 팩의 새 프로젝트는 최소 이 공통 하한을 검토하고, 실제 선택 버전의 engines와 peer dependency를 다시 확인한다. 오래된 Node로 억지 설치하지 않는다.
- [React useEffect](https://react.dev/reference/react/useEffect): 외부 시스템의 setup/cleanup과 개발 모드 재실행에 대비한다. AudioService를 render마다 만들지 않는 근거다.
- [Playwright Emulation](https://playwright.dev/docs/emulation): viewport·입력·기기 프로필 에뮬레이션 범위를 참고한다. 실제 iOS 오디오·전화·Bluetooth 검증을 완료했다고 주장하는 근거로 쓰지 않는다.
- [Web Audio 2021 Recommendation](https://www.w3.org/TR/2021/REC-webaudio-20210617/): 원본 설계가 채택한 안정 API 기준. 초안 기능을 필수화하지 않는다.
- [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): 사용자 제스처·음량/정지 제어·AudioParam 예약의 근거.
- [MDN BaseAudioContext state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state): running/suspended/closed 및 구현별 interrupted 대응. 특정 상태 문자열 존재만 가정하지 않는다.
- [MDN IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction): transaction 활성 수명주기와 완료/오류 처리를 확인하는 근거. request 성공과 전체 commit 성공을 구분한다.
- [W3C WCAG2.2](https://www.w3.org/TR/WCAG22/): 접근성 목표와 실제 적합성 확인을 구분한다. 제품 버튼 목표44px와 AA 최소타깃 기준24CSS px를 혼동하지 않는다.

음악이론과 8주문 정답·합주 수치는 사용자 원본 설계가 직접적인 기준이다. 참고 이론의 1차 자료는 [Puget Sound 3화음](https://musictheory.pugetsound.edu/mt21c/TriadsIntroduction.html), [전위](https://musictheory.pugetsound.edu/mt21c/InvertedTriads.html)이며 원본에서 확인한 출처다. 이 프롬프트팩은 이를 근거로 사용자에게 검증된 교육효과를 약속하지 않는다. 원본의 25ms/100ms scheduler, envelope, latency/용량 예산, 참가자6~8명은 프로젝트의 초기 설계값·검증 목표다.

## 부록 G. 이 프롬프트팩 자체의 검수 범위

이 문서는 원본 전체를 읽고 실행 단계·복구 지시·기준 데이터·검증 코드·추적표로 변환했다. 8주문 JSON 동일성, 독립 기준 검증기 실행, 고의 데이터 훼손 거절, 59개 합주 event와 release 경계를 문서 검수에서 확인한다. 프롬프트 파일의 구조와 코드 fence도 점검한다. 이번 파일은 원본 대조와 실행 검증을 포함한 체계적 자체 검토를 수행했으며, 별도 음악교육 담당자의 독립 검수는 개발 단계의 출시 게이트로 남긴다.

게임은 이 작업에서 구현하지 않았다. 따라서 React/Vitest/Playwright 앱 테스트, 실제 iOS/Android 오디오, 실제 IndexedDB 복구, VoiceOver/TalkBack, production 성능, 사용자 학습효과는 이 문서의 작성만으로 검증되지 않는다. 실행 지시와 이미 수행한 검사를 구분해야 한다.
