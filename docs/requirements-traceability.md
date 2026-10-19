# 요구사항 추적표

2026-10-19 UTC. 원문 `promptpack.md` 부록 C/D와 `design.md`의 요구 ID를 유지한다. 아래는 실제 파일과 검사 매핑이며, 최종 실행 성공 여부는 [QA 보고](qa/test-report.md)와 단계별 [인계](handoffs/)를 함께 읽는다. 일부 자동 검사 성공을 실제 기기·연구·법률 완료로 확장하지 않는다.

## 부록 C: REQ01–28

| ID | 요구 | 실제 구현 | 검사·증거 | 한계/상태 |
|---|---|---|---|---|
| REQ01 | 독립 이름·아트·DB namespace | package.json, src/persistence/db.ts, public/assets/chord-repair-shop | shell, 저장 E2E, 자산 ledger | 별도 작업 폴더·DB·포트·배포 프로젝트 |
| REQ02 | C/F/G 장단·8주문·60–74 | content/loader.ts, orders.v1.json, app/App.tsx | content, eight-orders | MVP 범위. 후속 기능 추가 없음 |
| REQ03 | 정규 철자·B#3/Cb4·음고류 | domain/music/pitch.ts,interval.ts | music.test.ts MUS01–06 | pure literal oracle |
| REQ04 | 근음·3음·5음·장단 관계 | music/chord.ts, ui/LearningTools.tsx, App.tsx | music, eight-orders CR07/08 | 음악교육 담당자 독립 검토 NOT RUN |
| REQ05 | exact multiset·전위·음역·철자 | domain/grading/grade.ts | grading.test.ts MUS07–14 | 일반 함수를 실제 호출. ID별 정답 반환 없음 |
| REQ06 | invalid/incomplete/incorrect/correct | grading/types.ts,grade.ts | grading DATA04/05, session | 앱 오류를 학습 오답으로 집계하지 않음 |
| REQ07 | JSON/map/질문/도달성 검증 | content/loader.ts, verify-reference.mjs | content 25개, 독립 원본 검증 | 원본 bytes 보존 |
| REQ08 | 제한 편집→모든 역할 | App.tsx, NoteInput.tsx | eight-orders, workbench | CR01/02 slot1만; CR07 fifth/CR08 root |
| REQ09 | 3단계 도움·시범·동등 보상 | session/reducer.ts, LearningTools.tsx | session, learning, eight-orders | snapshot 돌아오기/유지 구분 |
| REQ10 | 질문→해설·노출 보존 | session/evidence.ts, selectors.ts, persistence | learning, recovery | 첫 응답/최대 도움/노출 불변 |
| REQ11 | 무음·편의는 힌트 아님 | session/reducer.ts, App.tsx | session settings, ui-audio-lifecycle, accessibility | 실제 AT 사용 NOT RUN |
| REQ12 | 탭·cancel·preview 종료 | ui/NoteInput.tsx, audio/AudioService.ts | workbench, audio engine/lifecycle | native touch와 합성 취소 이벤트 구분 |
| REQ13 | 피아노·패드·키보드 동등 | NoteInput.tsx, components.tsx | workbench, keyboard eight-orders | Enter/Space/roving/Escape |
| REQ14 | 작은 화면·확대·대비·AT | styles.css, Modal, NoteInput | accessibility, axe evidence | 자동화만; VoiceOver/TalkBack NOT RUN |
| REQ15 | 단일 context·동일 비교·주파수 | audio/AudioService.ts,create-voice.ts,comparison.ts | engine/transport + native offline | Chromium/Firefox native; 사람 청취 NOT RUN |
| REQ16 | snapshot·generation·복귀 | audio/transport.ts,lifecycle.ts | transport + native lifecycle | 전화/출력변경 실제 기기 NOT RUN |
| REQ17 | voice≤24·늦은 event·지연 | audio/scheduler.ts,AudioService.ts | engine/transport/production/soak | 실제 스피커 지연 NOT RUN |
| REQ18 | 8마디·gate/release·solo/mute | ensemble-events.ts,ensemble.ts,Collection.tsx | ensemble unit/E2E + real24.4s | 59 event, 자동 loop 없음 |
| REQ19 | 상태 축·stale4식별·멱등 | session/* | session.test.ts, persistence | 재방문/새 연습 분리 |
| REQ20 | 원자 저장·debounce·증거 즉시 | persistence/controller.ts,repository.ts | persistence scheduling/native recovery | 저장 대기/진행/완료 정확히 구분 |
| REQ21 | 손상·backup·unknown·import | schemas.ts,import-export.ts,StorageControls.tsx | persistence, recovery, 600 fuzz | 실제 장치 공간 소진 대신 quota 오류 주입 |
| REQ22 | 두 탭 revision/lease | repository.ts,controller.ts | simultaneous lease + native two tabs | BroadcastChannel 없는 transaction 보호도 검사 |
| REQ23 | 자유 실험·재방문·동등 보상 | Collection.tsx, session/selectors.ts | ensemble-sandbox, learning | 미시작 home의 hidden에서도 가짜 attempt 없음 |
| REQ24 | 성능·20분·실기기 | scripts/production-qa.mjs,soak.mjs | qa/performance.md, S11 JSON | 물리 기기·출력 지연 NOT RUN |
| REQ25 | 무계정·최소 권한·권리 | vercel.json, public/licenses, package-lock | qa/security-review.md, npm audit | 최종 상표·법률 검토 NOT RUN |
| REQ26 | 플레이/개념/전이 분리 | evidence.ts, learning-evidence.md, research/* | session/learning + 연구 준비 검산 | 참가자 관찰·효과 검증 NOT RUN |
| REQ27 | 로드 후 offline 세션 | 정적 bundle/IndexedDB/Web Audio | production-qa: offline8/8+합주+복원 | 미캐시 장식 이미지 제한, offline 재실행 보장 없음 |
| REQ28 | 차단·결과·별도 공개 승인 | handoffs, implementation-status, release/* | QA/manifest/S14 실제 확인 | 개발 후보. 정식 출시 게이트 미완료 |

## 부록 D: 행별 회귀 매핑

경로는 `tests/` 아래다. PASS의 환경·수와 최신 실행은 QA 보고가 기준이다. 여러 assertion을 포함한 실제 테스트 한 개가 여러 요구를 검증할 수 있으므로 행 수를 테스트 개수로 합산하지 않는다.

| ID | 실제 검사 또는 manual case |
|---|---|
| MUS01 | unit/music: strict scientific pitch C4/Eb4/E4/G4 |
| MUS02 | unit/music: B#3/Cb4 및 spelling octave |
| MUS03 | unit/music: distinguishes diatonic and chromatic interval distances |
| MUS04 | unit/music: generates root major/minor by letter + literal 8화음 |
| MUS05 | unit/music: uses target spellings…63→Eb4 |
| MUS06 | unit/music: uses target spellings…70→Bb4 |
| MUS07 | unit/grading: rejects all initial chords…THIRD_MISMATCH |
| MUS08 | unit/grading: every target permutation + frozen input |
| MUS09 | unit/grading: compares multiplicity…fifth missing |
| MUS10 | unit/grading: pitch-class…inversion1/0/null |
| MUS11 | unit/grading: pitch-class…C4 G4 E5 |
| MUS12 | unit/grading: wrong register…REGISTER_MISMATCH |
| MUS13 | unit/grading: wrong spelling…spellingRequired true/false |
| MUS14 | unit/music voicing members mismatch + unit/grading multiplicity |
| DATA01 | unit/grading: all8 initial/target permutations |
| DATA02 | unit/content: loads exact8 immutable orders editableSlots |
| DATA03 | unit/content mutation cases; build invokes reference/content gate |
| DATA04 | unit/grading: invalid data over null (Infinity/NaN/duplicate IDs) |
| DATA05 | unit/grading: incomplete vs wrong slot count |
| DATA06 | unit/content: unreachable locked target/out of range |
| DATA07 | unit/content answer indexes + integration/learning stableID/permutation |
| STATE01 | unit/session: rejects another order at same revision |
| STATE02 | unit/session: stale response four identity fields |
| STATE03 | unit/session: pending submit/results once; skipped completion once |
| STATE04 | unit/session repeated same pitch; native workbench touch twice |
| STATE05 | unit/session: bounds undo50 + order transition clears history |
| STATE06 | unit/session: keeps first wrong after success |
| STATE07 | unit/session: restore same attempt/new practice + recovery E2E |
| LEARN01 | unit/session short confirmation; e2e/eight-orders question first |
| LEARN02 | unit/session skip/answer; e2e/eight-orders |
| LEARN03 | session reveal/demo + integration/learning tutorials |
| LEARN04 | unit/session help maximum + e2e/recovery reload |
| LEARN05 | integration/learning all8 assisted completions; E2E skip/reward |
| LEARN06 | unit/session settings independent; accessibility fixed-do/reduced motion. Actual VoiceOver/TalkBack NOT RUN |
| LEARN07 | e2e/eight-orders initial hint-panel absent, CR05–08 generic slot roles |
| LEARN08 | integration/learning 100seed×8orders + e2e/recovery DOM order |
| INPUT01 | e2e/workbench cancellation loop; audio preview bounded |
| INPUT02 | e2e/workbench native touch commit1/same MIDI0 |
| INPUT03 | e2e/workbench blur/capture/pagehide; native audio lifecycle |
| INPUT04 | e2e/workbench roving/Enter/Space/Escape; accessibility all8 |
| INPUT05 | e2e/workbench scroll/multitouch cancellation; physical pinch NOT RUN |
| AUDIO01 | e2e/audio-lifecycle first lock/no context/silent; ui pending enable |
| AUDIO02 | e2e/audio-engine native offline15 MIDI + A4 |
| AUDIO03 | audio/transport exact matched settings; native offline matrix |
| AUDIO04 | audio/transport exact timing/envelope; native offline silence tail |
| AUDIO05 | audio/transport + e2e/audio-lifecycle edit/undo/reset |
| AUDIO06 | audio/engine 25th voice/priority; e2e rapid10compare |
| AUDIO07 | native lifecycle synthetic hidden/pagehide/return; no auto replay |
| AUDIO08 | audio/engine pending/closed/reject; ui-audio-lifecycle late enable |
| AUDIO09 | audio/transport scheduler25/100ms late-event interruption/frozen audio clock |
| AUDIO10 | MAN-AUDIO-DEVICE: physical phone/lock/output/Bluetooth/low power NOT RUN |
| AUDIO11 | audio/engine fallback/unavailable; capabilities WebKit no API |
| AUDIO12 | native offline peak at44.1/48kHz,24voices,all timbres; no SPL claim |
| STORE01 | integration/persistence-scheduling 300ms/max1s |
| STORE02 | scheduling help supersedes edit; persistence first evidence/recovery |
| STORE03 | persistence complete once and abort rolls back all stores |
| STORE04 | persistence stale profile revision/lowered evidence |
| STORE05 | e2e/recovery question/explanation/first wrong/shuffle |
| STORE06 | native blocked IDB + injected QuotaExceededError E2E; true disk-full NOT RUN |
| STORE07 | e2e/recovery corrupt draft/raw remains/backup selected |
| STORE08 | integration/persistence missing evidence→unknown |
| STORE09 | integration invalid imports + native future schema/content raw retained |
| STORE10 | integration file size before read, malicious keys,600 bounded fuzz |
| STORE11 | e2e/recovery cancel unchanged/confirm atomic replace+backup |
| STORE12 | integration/persistence105 attempts→100details+first summary |
| STORE13 | integration simultaneous lease + e2e real two tabs |
| STORE14 | integration lease expiry explicit takeover + E2E owner release |
| STORE15 | integration lease/revision with no BroadcastChannel |
| ENS01 | audio/ensemble exact score order |
| ENS02 | audio/ensemble59/24/24.4 + e2e real full clock |
| ENS03 | audio/ensemble gate+release ≤nextbar−.01,min margin.03 |
| ENS04 | audio/ensemble solo/mute + native E2E stop/hidden/no repeat |
| ENS05 | integration/learning8 unique completion+skip; native collection unlock |
| SANDBOX01 | e2e/ensemble-sandbox progress/settings/attempt invariance |
| A11Y01 | accessibility keyboard all8 and modal focus/Escape |
| A11Y02 | MAN-AT: VoiceOver/TalkBack8orders/settings/export NOT RUN |
| A11Y03 | accessibility320/390/768/landscape/CSSzoom200/400; OS zoom NOT RUN |
| A11Y04 | accessibility axe4screens+computed contrast and noncolor labels |
| A11Y05 | accessibility reducedmotion + mute/announcement source; human AT live announcement NOT RUN |
| A11Y06 | workbench/layout actual bounds: main44/pad48/black36+pad alternative |
| PERF01 | scripts/audit-build and production-qa transfer |
| PERF02 | production-qa homeReadyAt under stated emulation; phone NOT RUN |
| PERF03 | production-qa raw samples, warmup5/50, prior misses retained |
| PERF04 | MAN-LATENCY: external acoustic/speaker/Bluetooth NOT RUN |
| PERF05 | scripts/soak real20min samples; final result in S11-soak.json |
| SEC01 | loader/import strict schema,600fuzz,source review |
| SEC02 | production externalRequests0 + source/Permissions-Policy |
| SEC03 | exactlock/dependency-ledger/art hashes/notices; legal final NOT RUN |
| SEC04 | export omission/schema and own-source inspection; no participant data |
| SEC05 | no service worker; explicit user GitHub/Vercel approval recorded in S14 |
| OFFLINE01 | production-qa network off→8repairs/fullensemble/save→online reload |

## 원본17.3 실패 시나리오12개

| 번호 | 실행 대응 |
|---|---|
| 1 | rapid10compare native + engine voice24 |
| 2 | live comparison edit generation native |
| 3 | unit/session mismatched order/attempt/submission; UI navigation cancels |
| 4 | pending resume navigation unit + native navigation stop |
| 5 | workbench scroll/pointercancel/multitouch; physical finger NOT RUN |
| 6 | native preview blur cleanup (synthetic event), frozen audio clock cleanup |
| 7 | native IDB denied/injected quota + memory export |
| 8 | actual IDB corrupt draft backup choice/raw preservation |
| 9 | missing legacy evidence unknown/future schema and content rejection |
| 10 | actual two tabs and transaction CAS |
| 11 | settings/fixed-do/motion/mute evidence invariance; OS font setting NOT RUN |
| 12 | CSSzoom200/400 and landscape viewport, physical rotation NOT RUN |

최종 검수는 자체 점검이다. 이전 병렬 준비/도메인 검토 기록은 단계 인계에 보존했지만 S13 최종 후보의 새로운 독립 검토를 받았다고 주장하지 않는다.
