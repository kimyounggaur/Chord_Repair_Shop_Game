# 원문 요구사항 검토 — M00 및 S00–S14

작성일: 2026-10-19 UTC. 검토 범위는 설계서와 프롬프트팩 전체, 두 부록의 주문 데이터 및 합주 산술이다. 이 문서는 구현 완료표가 아니며 앱·브라우저·실기기 테스트의 PASS를 부여하지 않는다. 현재 환경의 실제 구현 상태는 `implementation-status.md`와 단계별 실행 증거로 별도 판정한다. 과거 PC의 S00–S02 통과 이력을 현재 환경의 통과로 복사하지 않는다.

## 1. 확인한 기준과 권한

- 설계 기준: `sources/design-original.md`의 byte-preserving 원본 → 저장소 `docs/design.md`.
- 설계 SHA-256: `65cfbfda1d8f0b1256df402ec833b7f8653daf9db31037270372c92314221681`.
- 프롬프트 기준: `sources/prompts-original.md` → 저장소 `docs/promptpack.md`.
- 프롬프트 SHA-256: `7d624832ad32ed632597c210b8105eb5a73f069879ac9ba1a54fabe589e1721e`.
- 두 원본을 전체 읽었다. 최초 커넥터 텍스트 `sources/design.md`, `sources/prompts.md`는 원본과 `Trim()` 후 문자열 비교가 모두 동일했다. byte hash 기준 파일은 원본 두 파일이며 커넥터 텍스트의 hash를 대체 기준으로 쓰지 않는다.
- `Get-FileHash -Algorithm SHA256`로 두 hash를 재확인했다. 부록의 JSON 경계를 정규식으로 추출하여 `ConvertFrom-Json`/`ConvertTo-Json -Depth 30 -Compress`로 구조를 비교한 결과 두 8주문 배열이 일치했다(exit 0). 이는 앱 validator 테스트가 아니다.
- 사용자는 현재 kimyounggaur PC의 개발, 지정 GitHub 저장소 commit/push, 별도 Vercel 프로젝트 배포를 이미 승인했다. S14의 추가 승인 문구는 이 승인으로 충족된다. 새 자격증명·권한 확대·결제·임의 다른 서비스 연결·연구 참여자 연락은 승인 범위에 포함되지 않는다.
- 원본 백업과 사용자 변경을 보존하고 별도 작업 폴더를 사용한다. 오프라인 DESKTOP-FVHJSEO에 접근하지 않는다. dev/preview 포트는 5486/4486이다. 사용량 제한이 발생하면 우회하거나 모델을 바꾸지 않는다.

## 2. M00 공통 계약

원문 설계가 음악·콘텐츠·교육 계약의 기준이고 프롬프트팩은 실행 방법을 구체화한다. 정답·학습목표를 몰래 바꾸거나 fixture를 약하게 만들어 통과시키면 안 된다. 낮은 위험의 구현 선택은 근거를 기록하고 진행할 수 있다.

| 항목 | 반드시 유지할 계약 |
|---|---|
| 제품 분리 | 제품명 화음 수리점, 프로젝트/DB `chord-repair-shop`; 다른 게임·진행·아트와 혼합하지 않음 |
| 범위 | C/Cm/F/Fm/G/Gm, CR01–CR08, MIDI 60–74, 기본 위치·정확 음역, 무음 경로, 3단계 도움, 관계 질문, 자유 실험, 교대 합주, IDB 및 import/export |
| 후속 | 전위 강좌·다른 근음 강좌·7화음·MIDI 입력·마이크·계정·광고·결제·원격 기록·서버·LLM·PWA 재실행 오프라인·푸시·랭킹·경쟁 타이머는 미포함 |
| 음악 | C4=60, 장 `[0,4,7]`, 단 `[0,3,7]`; 음고·철자·음역·전위 별도 판정; exact는 MIDI 다중집합 |
| 학습 | 수정·탐색·듣기 횟수나 시간 감점 없음; 도움과 접근성 설정 분리; 수리 정답 직후 질문 먼저, 자세한 해설은 첫 응답/skip 뒤 |
| 레이어 | UI→세션→음악 도메인; 도메인에 DOM/React/AudioContext/IDB 의존 금지; 오디오는 정답을 모르며 문자열은 판정 입력 아님 |
| 증거 | 도움·시범·답 노출·첫 제출 이력은 undo/reset/reload로 소거하지 않음; 증거 누락은 unknown |
| 오디오 | 단일 context, 명시적 사용자 제스처, audio clock 예약, 동일 전후 음색/gain/velocity/gate, generation 취소, 복귀 자동 재생 없음 |
| 기록 | 매 단계 `implementation-status.md`와 `handoffs/Sxx.md`: 상태, 변경, 실제 명령·exit·개수·증거, 미실행·이유, 다음 입력 |
| 상태 표기 | 실제 기준 통과만 PASS. 일부 구현/검증은 PARTIAL. 특정 접근/실기기 없음은 해당 항목 BLOCKED 또는 NOT RUN. 수행하지 않은 검사를 0개 PASS로 표시하지 않음 |

금지 설명: “근음은 항상 최저음”, “3음은 항상 가운데”, “단화음은 나쁨/검은건반 하나”, “C화음=C장조”, “완주=음악 실력 향상”. 무음은 시각적 구조 학습이며 청각 능력 성취가 아니다.

## 3. 단계별 필수 산출물과 통과 근거

| 단계 | 필수 구현/문서 계약 | 반드시 확보할 검증 근거 |
|---|---|---|
| S00 | 기존 코드/변경 확인, 원본 byte 보존과 hash, 원문 JSON 추출, 독립 reference verifier, strict TS/React/Vite, exact 버전·lockfile, scope/decisions/toolchain/REQ01–28 추적표, 최소 셸 | Node/package manager 버전, reference 8주문, 원본/복사 부록 deep equality, typecheck/lint/smoke/build. 테스트 없는 그룹은 NOT RUN. 도메인 금지 import 강제 |
| S01 | 엄격 pitch parser, toMidi/frequency/generateTriad/interval/voicing/spellForTask, typed error, 순수·불변 함수, grammar·미지원 정책 | MUS01–14, B#3=60/Cb4=59, C–Eb 3도와 C–D# 2도 구분, 여섯 화음 literal oracle, 순열·넓은 배치, 지원 근음/변화표 property, 15음 주파수 |
| S02 | Grade 4상태·분리 flags·안정된 코드 우선순위, 엄격 Order loader, map 15키, target 생성 대조, 잠금·도달성·schema 검사, 잘못된 콘텐츠 build 실패 | 8 initial incorrect/8 target correct, 8×6 순열 correct, 중복음/NaN/누락/잘못된 ID·표기·map·버전 거절, null=incomplete와 구조오류=invalid 구분, 다른 octave=REGISTER_MISMATCH |
| S03 | 앱/학습/오디오/저장/화면 축 분리, 순수 reducer+command, 4식별값 stale 방어, undo 50, 단조 증거, 시범 snapshot, reflection 2단계, 멱등 완료, 8고유 주문 해금 | STATE01–07/LEARN01–06, 4식별값 각각 stale, 중복 CHECK/GRADE_READY/CONTINUE, firstWrong→correct, hint→undo/reset, demo→복귀, reveal→serialize/restore, skip 완료, 새 연습과 reload 차이 |
| S04 | 무음 CR01 수직 흐름, 원래/현재/목표 구분, index1 편집, Piano/NotePad 동등 입력, click 확정·pointer 취소, undo/reset 확인, keyboard/focus, 작은 화면 | CR01 D4오답→E4정답→질문→완료, undo/reset 취소·확정, 같은 MIDI revision 불변, 잠금, 두 입력 동등, 방향키/Enter/Space/Escape, scroll cancel, 320/390/가로 screenshot와 DOM assertion |
| S05 | 단일 AudioService, pending resume token, 자체 reference 합성/정규화/Nyquist, envelope, 최대 24 musical voices, 우선순위·future source 취소·disconnect, mute/volume ramp, fallback | frequency/envelope endpoint, invalid duration, register/cleanup, stop 멱등, 25번째 voice, StrictMode, closed/resume reject, mute fallback, OfflineAudioContext peak; 브라우저 재생과 실제 청취 별도 |
| S06 | 원래/현재/전후/한음씩/정지, immutable 현재 snapshot, 정확 비교 timeline, 모든 이동·편집·숨김 generation 취소, return 무음, late-event 정지 | AUDIO03–11, `.05/.95/1.35/2.25/2.40`, edit/undo/reset/이동 취소, 10연타, pending resume 취소, hidden future source=0, return start=0, closed/interrupted/reject, late event 정지; 실제 iOS/Android는 별도 항목 |
| S07 | 8주문 공통 Runner, 안내의 점진 제거, T0–T7 skip/replay, 도움 1/2/3, demo 복귀, 질문→해설, stable option ID와 seed/permutation, 수리/개념/첫시도 분리 | 각 주문 시작/목표/대표 오답/undo/도움/답·오답·skip·reveal, CR05/06 자동 힌트 없음, CR07/08 정답 슬롯 강조 없음, 100seed·reload·DOM 일치, 질문 전 누출 없음, 도움 8완료 동일 해금 |
| S08 | DB v1 6 stores, 모든 경계 schema, 300ms/max1s 편집 저장·즉시 증거 저장·완료 원자 transaction, revision 경쟁 방어, memoryOnly, backup/복구, 256KB import/export, 최근 100시도+요약, tab lease | STORE01–15, 실제 IDB와 fake 구분; reload 단계/증거, quota/security/abort, stale write, duplicate completion, 손상 backup/둘다손상, 구버전 unknown/미래 거절, 악성 키·크기·배열, import 취소/실패 원자성, 두탭/lease/BC 미지원 |
| S09 | 실제 button/label/heading/landmark, ARIA 상태, focus 복귀·모달, 최소 타깃·대비·색 외 표시, 320/200%/400%/가로 reflow, reduced motion, 무음 전체 흐름, 듣기/변경 분리 | A11Y01–06, 8주문 keyboard, 입력 동등, focus/modal, live 중복 없음, 대비 수치·screenshots. axe 등 자동 검사와 실제 VoiceOver/TalkBack을 분리. 수동 미확인은 출시 게이트 |
| S10 | 8고유 완료 교대합주, 59 events, solo/mute/stop, audio clock/취소, 6프리셋 자유 실험, 독립 낮 수리점 아트·장부, 효과음 뒤 재생 | ENS01–05/SANDBOX01, 정확 순서/시간/gate/release, 상충 화음 없음, 숨김 취소, 중복 보상 없음, Sandbox progress/attempt 불변, 자산 크기·권리·hash, 장식 전후 domain 회귀 |
| S11 | 요구 추적표·누락 회귀·기술 결함 수정·기기표·성능/보안/QA 보고, clean 검증, offline 세션, 20분 누수 | reference→content→typecheck→lint→unit→integration→audio→E2E→a11y→build; Chromium/Firefox/WebKit·320/390/가로·키보드; 원본 실패 12종; 실제 iOS/Android/AT는 별도; 지연 측정 조건/표본 명시 |
| S12 | usability protocol, transfer bank, consent/data plan, findings template; 승인 없는 모집/연락/녹화 없음; 관찰 결과를 만들지 않음 | 문항 정답·독립성·노출·유도성·최소수집 점검. 미실험은 NOT RUN, 효과 수치 공란. 코드 변경 시 S07/S09/S11 회귀. 연구 패키지 준비와 실제 관찰 완료는 별도 |
| S13 | 독립 검토/자체 검토 표시, releaseId·contentVersion·asset/lockfile manifest, release notes·지원환경·known issues·rollback·operations·README, 원본24장 체크리스트 | clean check·hash/manifest·8주문 표본·라이선스·네트워크·namespace·실제 명령 확인. 필수 실기기/관찰이 남으면 개발 후보/출시 준비 미완료. 존재하지 않는 이전 배포/롤백을 주장하지 않음 |
| S14 | 이미 승인된 별도 Vercel 프로젝트 배포, 승인 artifact만 업로드, HTTPS/SPA/MIME/cache/CSP, release/hash/URL, 사후 smoke, 기존 인증 사용 | 배포 READY 및 실제 운영 URL 접근, 최초 로드·자산·CR01 무음·사용자 제스처 오디오·8콘텐츠·route 새로고침·저장·모바일·headers, 후보와 배포 hash/contentVersion 일치. 실기기 미검증/청취 한계 공개 |

단계 진행 순서는 S00→S14다. 병렬 조사/검토는 가능하나 선행 계약과 연결 검증을 생략해 단계 PASS로 간주하지 않는다. S12에서 흐름을 바꾸면 관련 S11 회귀를 다시 실행한다. 원문 템플릿의 “배포는 하지 않는다”는 해당 단계의 기본 범위이며 이미 부여된 전체 배포 승인을 취소하는 문구로 해석하지 않는다.

## 4. 고정 주문 데이터 요약

모든 주문 공통: schemaVersion=1, contentVersion=`1.0.0`, allowedMidi=`[60,74]`, registerMode=`exact`, spellingRequired=`false`, inversion=0. CR01/02만 editableSlots=`[1]`, hintPolicy=`guided`; 나머지는 `[0,1,2]`, `optional`. 모든 시작은 오답이며 목표 세 음의 6순열은 정답이다.

| ID / 제목 | 주문 | 초기 표기 / MIDI | 목표 표기 / MIDI | 바꾸는 역할 | 초기 대표 코드 | 질문 정답(원본 index) |
|---|---|---|---|---|---|---|
| CR01 처음 맡긴 오르골 | C major | C4 Eb4 G4 / 60,63,67 | C4 E4 G4 / 60,64,67 | third | THIRD_MISMATCH | C와 G (0) |
| CR02 반대로 고치기 | C minor | C4 E4 G4 / 60,64,67 | C4 Eb4 G4 / 60,63,67 | third | THIRD_MISMATCH | 3 (0) |
| CR03 다른 근음에서도 같은 관계 | F major | F4 Ab4 C5 / 65,68,72 | F4 A4 C5 / 65,69,72 | third | THIRD_MISMATCH | 근음에서 3음 4반음 (0) |
| CR04 검은건반과 음이름 | G minor | G4 B4 D5 / 67,71,74 | G4 Bb4 D5 / 67,70,74 | third | THIRD_MISMATCH | Bb (1) |
| CR05 도움 없는 장3화음 확인 | G major | G4 Bb4 D5 / 67,70,74 | G4 B4 D5 / 67,71,74 | third | THIRD_MISMATCH | 3음이 반음 높아짐 (0) |
| CR06 도움 없는 단3화음 확인 | F minor | F4 A4 C5 / 65,69,72 | F4 Ab4 C5 / 65,68,72 | third | THIRD_MISMATCH | 3과 7 (0) |
| CR07 가운데 음만 고치지 않기 | C major | C4 E4 F#4 / 60,64,66 | C4 E4 G4 / 60,64,67 | fifth | FIFTH_MISMATCH | 7반음 (0) |
| CR08 주문의 근음 확인 | F minor | E4 Ab4 C5 / 64,68,72 | F4 Ab4 C5 / 65,68,72 | root | ROOT_MEMBER_MISSING | F와 Ab (0) |

공통 display map은 `60 C4, 61 Db4, 62 D4, 63 Eb4, 64 E4, 65 F4, 66 F#4, 67 G4, 68 Ab4, 69 A4, 70 Bb4, 71 B4, 72 C5, 73 Db5, 74 D5`의 정확히 15키다. 목표 구성음의 문맥 철자가 이 map보다 우선한다. map은 정답 계산에 쓰지 않는다. 한국어 문항/선택지 전체는 원문 부록 JSON을 직접 추출하며 이 표를 재생성 입력으로 사용하지 않는다.

CR04만 원본 answerIndex=1이고 나머지는 0이다. shuffle 뒤 화면 index를 answerIndex와 직접 비교하면 안 된다. 원본 option의 stable ID, seed, 실제 permutation을 저장하고 시각 순서=DOM 순서를 유지한다.

## 5. 특히 위험한 구현 함정

### 음악과 콘텐츠

1. `Set` 비교는 중복음을 제거한다. C/E/E를 C/E/G와 같은 것으로 판정하지 않도록 pitch-class와 exact 모두 빈도를 보존한다.
2. exact는 슬롯 위치가 아닌 음고 다중집합이다. `[67,60,64]`는 C major 정답이다. 슬롯은 물리 ID이며 현재 음의 이론적 역할을 고정하지 않는다.
3. B#3와 C4는 MIDI 60이지만 표기는 다르다. 표기 octave를 MIDI로 재계산해 덮지 않는다. Cb4=59도 동일한 경계 반례다.
4. 입력 MIDI63을 C minor에서 Eb4로 표시하는 것과 일반 철자 시험에서 D#4를 SPELLING_MISMATCH로 거절하는 것은 다른 경로다.
5. C–D#의 3반음은 문자 기준 2도이며 C–Eb의 단3도와 다르다. 전역 sharpNames로 화음 생성하면 잘못된 철자가 나온다.
6. 구성음이 틀렸다면 전위명을 생성하지 않는다. 다른 octave지만 같은 음고류인 경우 종류는 맞음과 지정 음역 다름을 분리한다.
7. JSON의 targetMidi를 oracle처럼 무조건 믿거나, UI에 또 정답을 하드코딩하지 않는다. root+quality, 정규 표기, targetMidi, 원본 fixture가 모두 맞아야 한다.

### 상태와 학습 증거

1. stale 응답 검사는 revision 하나로 부족하다. `{orderId,attemptId,revision,submissionId}` 네 값 모두 활성 요청과 일치해야 한다.
2. `CHECK`/`GRADE_READY` 중복, `CONTINUE` 중복, 늦은 완료 callback은 별개로 검사한다. 완료 키는 `{orderId,contentVersion,completionId}`다.
3. 새 주문/명시적 재연습은 새 attemptId, 새로고침/숨김 복귀는 기존 attemptId다. reset을 새 독립 시도로 만들지 않는다.
4. undo 50개는 음 배열과 선택 슬롯만 복원한다. maxRepairHintLevel/maxReflectionHintLevel, 최초 제출, 해설 노출은 감소하지 않는다. 시범 복귀도 assisted 이력을 보존한다.
5. 질문에 답하기 전에 “3음이 반음 높아졌어요” 같은 해설을 자동 노출하면 독립 확인이 오염된다. 도움 2도 답을 사실상 알려주면 reveal을 기록해야 한다.
6. `answerRevealedBeforeFirstAnswer` 누락을 false로 채우면 안 된다. 구버전/손상 복구의 증거는 unknown이다. guided CR01/02에 자동 독립 성취를 부여하지 않는다.
7. 8개 고유 완료가 합주 조건이다. CR08 완료만 검사하거나 동일 주문 중복 완료를 8개로 세면 안 된다. 질문 skip/오답/도움/무음은 보상을 막지 않는다.
8. 접근성 설정과 입력 도구는 힌트가 아니다. Sandbox는 주문 attempt/progress를 쓰지 않는다.

### 오디오

1. `AudioContext.state === running`은 실제 청취 증거가 아니다. mock 예약 PASS, OfflineAudioContext PCM 측정, 실제 브라우저 graph 동작, 사람 청취, 실기기 OS 동작을 따로 기록한다.
2. React effect/StrictMode로 context를 중복 생성하지 않는다. pending resume 중 주문 이동/취소 후 resolve되면 token을 확인해 stale 음을 내지 않는다.
3. 비교 현재 음은 버튼 시점 immutable snapshot이며 목표 답을 대신 재생하면 안 된다. 원래/현재는 동일 reference/gain/velocity/gate다.
4. t0+0.05 원래 start, 0.95 gate end, 1.35 현재 start, 2.25 gate end, 2.40 종료. release 각 0.12초다. JS timeout이 음 시작 시계가 아니다.
5. edit/undo/reset/뒤로/주문 변경/설정 이동/hidden은 future source와 완료 callback까지 취소한다. generation을 UI 표시만 바꾸고 노드를 남겨두면 stale 소리가 난다.
6. hidden은 generation 증가→큐/타이머 취소→active 10ms fade→future stop→저장→suspend 시도. suspend 실패에도 paused. return은 자동 재생 0회다.
7. 최대 24는 musical voice 수이며 oscillator 수가 아니다. 한 voice의 모든 배음을 정리한다. 초과 시 낮은 우선 preview를 8ms fade하고 비교 3음을 한 묶음으로 유지한다.
8. preview gate<=0.35초로 pointerup 유실을 막는다. mute ramp에 exponential 0을 쓰지 않는다. synthesis 실패 fallback은 sine 1회, 계속 실패하면 무음 유지다.
9. lookahead 100ms/조회 25ms는 큐 보충값이며 실제 시작은 audioTime. currentTime+5ms에 늦은 event는 몰아 재생하지 않고 중지·재시작 안내한다.
10. reference 배음 `[1,.18,.08]`, attack .008/decay .070/sustain .55/release .120/gate .9/master .35는 초기 config다. -1dBFS peak 및 .35는 실제 음압 안전을 보장하지 않는다.

### 저장과 복구

1. DB 이름 `chord-repair-shop`, version1. stores는 meta/profile, settings/main, attempts/attemptId, progress/orderId, draft/active, backup/previous다.
2. global 저장 revision과 session 음 revision을 구분한다. 늦은 debounce나 과거 attempt 저장이 현재 기록을 덮지 않도록 직렬화 또는 transaction CAS/owner token을 사용한다.
3. 음 변경 300ms debounce/maxWait 1초. HINT/CHECK/ANSWER/SHOW_EXPLANATION/SKIP은 증거와 draft를 즉시 같은 transaction에 저장한다.
4. progress+attempt+draft 정리는 하나의 완료 transaction이다. request onsuccess는 전체 transaction commit 성공이 아니다. transaction 내부 무관한 await는 자동 비활성화를 유발할 수 있다.
5. draft에 학습/질문 단계, first answer/submission, 두 도움 최대값, reveal, completionId, shuffle seed/permutation까지 있어야 reload가 같은 학습 상태를 복구한다.
6. 실패는 수리 성공을 취소하지 않는다. failed/memoryOnly 배너·재시도·내보내기를 제공하고 pagehide만 믿지 않는다.
7. 손상 발견은 deleteDatabase 근거가 아니다. 검증된 backup/현재 기록 내보내기/범위를 밝힌 새 시작을 제시한다. import는 자동 병합이 아닌 확인 후 backup+원자적 교체다.
8. import는 읽기 전 File.size<=256KB, parse 후 엄격 recursive schema·배열/문자/버전/ID/정수/prototype 키 검증. 미래 버전을 조용히 downgrade하지 않는다.
9. 상세 100시도 초과 시 주문별 요약으로 압축하되 첫 시도·도움·최근 성취 증거를 버리지 않는다. 바이트 크기와 문자 수는 다르다.
10. BroadcastChannel은 조정 힌트다. 실제 commit의 revision/owner 검증, lease 만료·명시적 인수, 미지원 fallback이 필요하다. background 탭이 영구 점유하지 않도록 한다.

## 6. 합주 59개 event의 정확한 산술

| 값 | 고정값 |
|---|---|
| 진행 순서 | CR01, CR02, CR03, CR06, CR05, CR04, CR08, CR07 |
| 화음 | C, Cm, F, Fm, G, Gm, Fm, C |
| 템포/박자 | 80 BPM, 4/4, 1박=.75초, 1마디=3초 |
| 본문/transport 끝 | 24초 / 24.4초 |
| 마디 1–7 root | 박0/2, gate1.4박=1.05초 |
| 마디 1–7 third | 박1/3, gate.8박=.6초 |
| 마디 1–7 fifth | 박.5/1.5/2.5/3.5, gate.3박=.225초 |
| 마디8 | 세 역할 모두 21.0초 start, gate3.5박=2.625초 |
| event 개수 | 7×(2+2+4)+3=59; 역할별 root15/third15/fifth29 |
| release | .12초, 모든 gateEnd+release<=다음마디-.01초 |
| 공통 마디 마지막 fifth | 2.625 start→2.850 gate end→2.970 audible end; 다음마디까지 .030초 |
| 마지막 마디 종료 | 23.625 gate end, 23.745 audible end; 24.4까지 gate를 늘리지 않음 |

위 계산은 검토자가 PowerShell로 독립 계산해 확인했다(exit 0). 실제 앱의 `buildEnsembleEvents()`가 반환한 event dump를 이 oracle과 비교해야 구현 검증이 된다. reference verifier만 두 번 실행하는 것은 이 요구를 만족하지 않는다. 재생 중 다른 마디의 장·단 3음이 겹치지 않아야 하며 자동 반복하지 않는다.

## 7. 모바일·접근성 수치와 성능 예산

- Piano: 15반음, 흰건반56×144px/검은건반36×88px, 내부 수평 스크롤과 낮은/높은 쪽 버튼. 320px에 강제 축소하지 않는다.
- NotePad: 4열, 각48×48px 이상, 간격8px, 항상 동등 경로 제공. 일반 주요 버튼 제품 목표44px와 WCAG AA 최소24 CSS px를 혼동하지 않는다.
- touch-action:auto, 취소된 scroll/pinch/multitouch는 음 교체하지 않음. pointerdown은 preview만, 실제 교체는 click 한 번. 키보드 합성 click도 허용한다.
- 320px/200%/400%/가로/safe-area/주소창 가변높이에서 본문 reflow. 본문 가로 overflow 없음. 피아노 내부 탐색은 별도이며 footer가 마지막 행동을 가리지 않는다.
- 대비 목표 본문4.5:1, 큰글자3:1, 필수 UI 경계3:1. 선택·잠금은 색 외 문자/윤곽 제공. 실제 비율 검증 없이 적합성을 주장하지 않는다.
- reduced motion 초기 반영·사용자 설정, 진열<=300ms·skip·정적 대체. live region은 변경1회당1회, audio tick마다 읽지 않는다.
- 초기 JS gzip<=250KB, 작업대 전송<=1.5MB, 자산<=5MB. 배경250KB/소품80KB/손님60KB/token3KB/icon2KB.
- 첫 의미 화면2.5초, tap→paint p95 100ms, tap→schedule p95 30ms, 실측 speaker p95 100ms는 목표값이다. 기기/망/표본/측정 방법 없이 달성값으로 쓰지 않는다. 20분 누수 관찰은 실제 20분 수행해야 한다.

## 8. 미검증·차단 분류와 보고 방법

| 분류 | 예 | 개발과 배포 처리 |
|---|---|---|
| 구현 결함/실제 FAIL | 잘못된 정답·표기·주파수, 자동 큰 소리, 진행 삭제, 도움을 독립 성취로 기록, 핵심 접근성 차단, 권리 미확인 자산 | 출시 차단. 재현→최소 수정→관련/전체 회귀. 배포 성공만으로 해결됐다고 하지 않음 |
| 로컬에서 가능한 미실행 | 타입/빌드/도메인/콘텐츠/세션/IDB 통합/E2E/audio schedule/axe/자산 크기 | 도구 가능 범위에서 실제 수행. NOT RUN을 PASS로 바꾸지 않음. 단순 시간 절약 때문에 생략하지 않음 |
| 실기기 자원 미확보 | iOS/Android unlock·잠금·전화·출력전환·Bluetooth·저전력, 실제 손가락 오탭, VoiceOver/TalkBack | 해당 시험 NOT RUN/BLOCKED 및 기기 필요를 기록. 독립 개발/로컬 검증은 계속. 정식 출시 준비 완료·지원 보장을 하지 않음 |
| 실제 청취/물리 계측 없음 | 스피커에서 음이 실제 들림, 음질·클릭·음압, finger→speaker latency | mock/OfflineAudioContext/브라우저 graph 결과와 구분. “오디오 예약/PCM 확인, 청취 미실행”처럼 정확히 표현 |
| 연구 미실행 | 6–8명 사용성 관찰, 독립 음악교육 검수, 학습효과·전이 | S12 문서·정답 검산은 진행. 참가자 결과/효과 수치 없음. 모집·연락·녹화는 별도 승인 없이 하지 않음 |
| 후속 범위 | PWA 오프라인 재실행·전위강좌·마이크·계정 | MVP 결함으로 세지 않음. 로드 후 현재 세션 offline은 MVP 검증 대상 |
| 인증/정책/사용량 거절 | 기존 인증으로 push/배포 불가, 새 credential/권한/결제 필요, 사용량 제한 | 정확한 action/target/reason/완료내역/denied·pending·uncertain 상태 보고. 우회/모델 변경 없음. uncertain은 상태 먼저 확인 |

실기기/관찰 없음은 전체 개발을 중단시킬 이유는 아니지만 사소한 장식 부족으로 낮추어서도 안 된다. 원문 S06은 실기기 결과가 없으면 해당 항목을 BLOCKED로, S09/S13은 출시 게이트 미완료로 남기라고 명시한다. 사용자의 이번 배포 승인을 적용해 개발 후보를 공개하더라도 남은 게이트와 공개 상태를 함께 보고한다. “배포 READY”는 호스팅 상태이고 “정식 출시 준비 완료”와 동일하지 않다.

권장 최종 기록은 `개발 후보 배포 완료(READY/실제 URL 확인), 자동/브라우저 검증 범위 명시, 실제 청취·실기기·AT·사용성 관찰 미실행 항목 명시`처럼 구분한다. 실제 결과가 없는 항목을 미리 이 문구로 완료했다고 기록해서는 안 된다.

## 9. 리뷰 인계

이 문서는 원문 검토 산출물만 추가하며 설계 원본·프롬프트·게임 구현을 수정하지 않았다. 구현자는 원문 부록 C REQ01–REQ28 및 부록 D의 MUS/DATA/STATE/LEARN/INPUT/AUDIO/STORE/ENS/SANDBOX/A11Y/PERF/SEC/OFFLINE 각 행에 실제 파일·test ID·결과·증거를 연결해야 한다.

최우선 교차 검토 지점은 (1) 4식별값 및 단조 증거, (2) 질문 전 답 누출과 shuffle 저장, (3) pending resume 및 future source 취소, (4) transaction 완료/두 탭 경쟁, (5) 실제 앱 합주59event, (6) emulation·청취·실기기·연구의 정직한 구분이다.
