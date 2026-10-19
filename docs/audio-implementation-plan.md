# S05 / S06 / S10 오디오 구현 준비

작성: 2026-10-19 UTC. 상태: **설계 준비만 완료, 구현·오디오 검증 미실행**.

부모 작업의 지시에 따라 S04 완료 및 착수 통지를 기다린다. 이 문서는 S05/S06/S10 통과 보고가 아니다. 소스·기준 설계·기준 콘텐츠는 수정하지 않는다. 개발 서버는 5486, production preview는 4486을 사용한다.

## 읽은 기준과 경계

- `design.md` 9.3, 10장 전체, 11장 전체, 13.1, 14장, 17.3~17.4, 18장, 20.7.
- `promptpack.md` M00 및 S05/S06/S10 실행 작업·실제 테스트·통과 기준.
- REQ12, REQ15~18, REQ23 및 AUDIO01~12, ENS01~05, SANDBOX01.
- AudioService는 음 이벤트만 받는다. 주문 정답·점수·학습 결과를 알지 못한다. 세션은 `{orderId, attemptId, revision}`으로 snapshot 취소를 명령하고 오디오 실패 때문에 수정·도움·완료 기록을 바꾸지 않는다.
- 2026-10-19 확인한 구현 참고: [MDN scheduled-source stop](https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/stop), [MDN cancelAndHoldAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/cancelAndHoldAtTime), [MDN OfflineAudioContext](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext), [React useEffect](https://react.dev/reference/react/useEffect). 예약 시작 전에 stop을 예약하면 소리가 시작되지 않는다. `cancelAndHoldAtTime`은 기능 탐지가 필요하다. offline 렌더는 버퍼 증거이지 스피커 청취 증거가 아니다. React 개발 StrictMode의 추가 setup/cleanup을 고려한다.

## 단계별 파일과 시작 조건

| 단계 | 소유 파일 | 시작 전에 필요한 입력 |
|---|---|---|
| S05 | `src/audio/{AudioService,create-voice,envelope,mixer,types}.ts`, 테스트 clock/context adapter, `tests/audio/engine.test.ts`, offline render 검사, `docs/audio-contract.md` | S04 adapter와 gesture cleanup, S01 frequency, 최신 S03/S04 인계 |
| S06 | `src/audio/{transport,comparison,scheduler,lifecycle}.ts`, `tests/audio/transport*.test.ts`, `tests/e2e/audio-lifecycle.spec.ts`, `docs/qa/mobile-audio.md` | S05 테스트 결과와 API, S03 명령, S04 듣기 버튼 |
| S10 | `src/content/ensemble.v1.json`, `src/audio/ensemble-events.ts`, `tests/unit/ensemble.test.ts`, Ensemble/Sandbox UI 및 E2E | S06 scheduler, S07 고유 완료 집합, S09 접근성 컴포넌트 |

각 단계에서 먼저 실패하는 계약 테스트를 만들고 구현한다. 부모 작업이 통합 현황 파일을 관리하는 동안 중복 편집하지 않는다. 인계 파일은 각 단계가 실제 실행된 후 쓴다.

## S05 합성과 envelope

| 항목 | 고정 계약 |
|---|---|
| 조율 | `440 * 2 ** ((midi - 69) / 12)`; A4 = 440 Hz |
| reference 배음 | `[1, 0.18, 0.08]`, 살아남은 배음 진폭 합으로 정규화; `frequency * harmonic < sampleRate / 2`만 사용 |
| envelope | attack 0.008 s, decay 0.070 s, sustain 0.55, release 0.120 s |
| 기본 gate | 0.900 s; gate는 시작부터 note-off까지이고 release를 포함하지 않음 |
| preview | 시작 여유 0.010 s 제안(허용 범위 0.005~0.020); gate 최대 0.350 s |
| master | 초기 0.35, 사용자 범위 0~1, 음소거는 별도 상태; 실제 기기 음량을 낮추라는 안내 |
| 비교 | 같은 reference config version, 같은 velocity·gate·gain·음정 외 조건 |
| 출력 | 샘플 peak 목표 `20 * log10(max(abs(samples))) <= -1 dBFS` |

구현 선택안 `audioConfig.version = 1`: 선형 AudioParam ramp로 `tStart: 0 → tStart+.008: peak → tStart+.078: peak*.55 → tGateEnd: 현재 envelope 값 → tGateEnd+.120: 0`을 예약한다. gate가 attack/decay보다 짧을 수도 있으므로 pure `envelopeValueAt(t)`로 note-off 시점 값을 계산하고 그 이후 단계는 예약하지 않는다. 음수/NaN/Infinity 시간·gate·frequency·velocity는 노드 생성 전에 거절한다. velocity는 각 비교 묶음의 모든 음에 동일하게 적용한다.

부분음 oscillator마다 amplitude gain을 거쳐 하나의 voice envelope로 합친다. **musical voice는 한 음**이고 그 음의 oscillator 여러 개는 별도 voice로 세지 않는다. `sources[]`, gain, 시작/끝 시각, groupId, generation, priority, 상태를 한 registry 항목에 보관한다. start는 source당 한 번, source와 gain은 재사용하지 않는다. 모든 부분음 ended를 확인한 뒤 연결과 registry를 정리한다. 부분 생성 실패도 이미 만든 노드를 정리한다.

중단 ramp는 native `cancelAndHoldAtTime(now)`를 기능 탐지하고, 없으면 직접 기록한 envelope/ramp의 `valueAt(now)`를 계산하여 `cancelScheduledValues(now) → setValueAtTime(value, now) → linearRampToValueAtTime(0, end)`를 사용한다. 예약된 automation이 있을 때 `.value`를 정확한 현재 값으로 가정하지 않는다. zero로 exponential ramp하지 않는다. 중복 stop은 같은 종료 시각을 뒤로 미루지 않는 멱등 처리다.

## mixer, voice 한도, 소유권

1. 앱 진입 모듈에서 AudioService 인스턴스 한 개를 만든 뒤 주입한다. 이때 AudioContext를 만들지 않는다. 첫 명시적 소리 켜기/듣기 handler에서만 context를 만들거나 resume한다. React render나 mount effect는 생성 지점이 아니다.
2. context 생성/재개 뒤 실제 `state === 'running'`, 최신 request token, 최신 generation, 문서 visible을 모두 확인한다. pending resume 동안 취소된 요청은 음을 생성하지 않는다. 중복 resume는 하나의 pending promise를 공유해도 재생 요청 token 검사는 각각 한다.
3. 우선순위는 `compare > normal/ensemble > preview`다. 비교 3음은 동일 groupId의 원자적 묶음이다. 수용 가능 slot이 부족하면 묶음 전체를 대기 또는 거절하고 일부 음만 재생하지 않는다.
4. 24 한도에는 예약 voice, 소리 나는 voice, fade 중 voice를 포함한다. 초과 요청은 오래된 낮은 priority preview부터 8 ms fade한다. fade 중 registry를 먼저 지워 25번째 voice를 숨기지 않는다. slot이 실제 해제되는 시각 이후로 새 묶음을 예약하거나 수용을 거절한다. 같은/높은 priority voice를 임의로 부분 제거하지 않는다.
5. 비교는 합주/완료 효과음/다른 transport를 취소하고 시작한다. 다음 비교와 preview 폭주는 마지막 유효 요청만 남긴다. 10 ms 취소 fade를 마친 후 새 transport 시작 여유를 적용하여 이전 tail이 첫 화음을 덮지 않게 한다.
6. headroom은 harmonic 정규화와 voice 수 예약으로 보장한다. 제안: transport 시작 전에 최대 동시 voice 예산을 예약하여 bus scale을 `0.8 / max(3, reservedVoices)`로 정하고 그 transport 내에서 고정한다. 일반 비교는 3, 합주도 패턴상 3 이하이며 전후 gain을 같게 유지한다. 24 voice 스트레스 fixture는 예산 24다. 새 예산을 늘릴 때는 master에 도달하는 합계가 상한을 넘기 전에 scale 감소를 예약한다. 낮은 우선순위의 소리가 비교 중 들어오지 않게 한다. 계산상 상한을 실제 offline 렌더로 확인하고 값은 문서화한다.
7. volume/mute ramp는 현재 gain을 유지한 뒤 10 ms 선형 ramp하는 제안이다. mute 상태에서도 세션은 유지된다. stop 버튼은 muted/locked/preparing/paused에서도 사용 가능하다. limiter는 peak 보장의 대체 수단으로 쓰지 않는다.
8. unsupported, resume failure, synthesis failure를 분류한다. synthesis 실패에만 sine fallback 한 번을 적용한다. fallback도 실패하면 unavailable이며 시각 학습을 계속한다. context가 closed면 다음 명시적 입력에서 이전 그래프 참조를 정리한 뒤 새 context를 만든다. 자동 재생 재시도는 하지 않는다.

## 제안 API와 테스트 경계

아래는 저수준 오디오 인터페이스 설계안이다. 지금 구현된 API가 아니다. 뒤의 “S03/S04 실제 계약 확인” 절에 현재 UI의 확정된 이름과 연결 방식을 기록한다.

```ts
type AudioState = 'locked' | 'preparing' | 'ready' | 'playing' | 'paused' | 'unavailable';
type Priority = 'preview' | 'normal' | 'ensemble' | 'compare';
type SnapshotKey = Readonly<{ orderId: string; attemptId: string; revision: number }>;
type Snapshot = Readonly<{ key: SnapshotKey; original: readonly number[]; current: readonly number[] }>;
type NoteEvent = Readonly<{
  id: string; groupId: string; at: number; gate: number; midi: number;
  velocity: number; timbre: 'reference' | 'pluck' | 'reed' | 'bell';
  priority: Priority; generation: number;
}>;
type AudioRuntime = {
  createContext(): AudioContext;
  setTimer(fn: () => void, milliseconds: number): unknown;
  clearTimer(id: unknown): void;
  isHidden(): boolean;
};

// absolute `at` is AudioContext time, never Date.now()/performance.now().
interface AudioServicePort {
  unlockFromGesture(): Promise<boolean>;
  beginRequest(priority: Priority): number; // increments request token/generation, cancels prior work
  scheduleGroup(events: readonly NoteEvent[]): boolean;
  previewFromGesture(midi: number): Promise<void>;
  cancelGeneration(generation: number, fadeSeconds?: number): void;
  stopAll(fadeSeconds?: number): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  getDiagnostics(): Readonly<{ state: AudioState; generation: number; voiceCount: number; contextCount: number }>;
  subscribe(listener: () => void): () => void;
}
```

저수준 `createVoice(context: BaseAudioContext, event, config, output)`는 브라우저 AudioContext와 OfflineAudioContext가 같은 코드 경로를 쓰도록 한다. runtime의 audio clock은 injected context의 `currentTime`, wall clock은 injected timer다. 단위 테스트에서 두 시계를 따로 움직인다. diagnostics는 로컬 최소 수치만 제공하고 원본 학습 기록·오디오 버퍼·장치 식별자를 전송하지 않는다. 테스트 편의를 위한 전역 API는 production에서 노출하지 않는다.

S06 transport는 `playOriginal(snapshot)`, `playCurrent(snapshot)`, `compare(snapshot)`, `oneByOne(snapshot, version)`, `stop(reason)`, `invalidate(key)`를 제공한다. snapshot은 호출 즉시 deep copy/freeze하고 타깃 정답 데이터를 읽지 않는다. S03 세션의 edit/undo/reset/order 이동 명령은 `invalidate/stop`을 먼저 실행한다. 상태 전달은 구독이며 audio가 session reducer를 직접 수정하지 않는다.

## S06 타임라인과 취소

`t0`는 resume 완료와 token 확인 후 확정한 audio 기준점이다. 문서의 t0는 사용자 입력 순간이지만 locked context가 아직 진행하지 않을 수 있으므로 화면 snapshot은 즉시 캡처하고 실제 예약은 context가 running이 된 뒤 동일 상대 시각으로 실행한다. preparing 지연을 숨기지 않는다.

| 비교 시각 | 이벤트 |
|---:|---|
| t0 | 원래/현재 음이름과 immutable snapshot 표시 |
| t0 + .05 | 원래 3음 동시 start |
| t0 + .95 | 원래 gate 끝 |
| t0 + 1.07 | 원래 release 끝 |
| t0 + 1.35 | 현재 3음 동시 start |
| t0 + 2.25 | 현재 gate 끝 |
| t0 + 2.37 | 현재 release 끝 |
| t0 + 2.40 | 완료; completion callback도 generation 검사 |

비교 6음을 Web Audio 절대 시각으로 예약할 수 있다. UI 타이머는 상태 갱신에만 사용하며 음 시작을 호출하지 않는다. 완료는 `currentTime >= endAt`를 검사하므로 wall clock만 전진시키면 완료되지 않는다. 모든 예약 source가 registry에 있으므로 2번째 화음 시작 전 edit·undo·reset·화면 이동·10연타가 취소할 수 있다.

`한 음씩`의 미지정 값 제안: ascending MIDI 정렬(같은 음 중복은 유지), 첫 시작 `.05`, 다음 `.50`, 다음 `.95`, 마지막 동시 화음 `1.40`; 개별 gate `.25` + release `.12` = `.37`로 `.45` 간격에 80 ms 여유, 마지막 gate `.90`, 마지막 release 종료 `2.42`, transport 끝 `2.45`초. 원래/현재에 같은 config 적용. 기본 비교에는 이 패턴을 사용하지 않는다.

취소 순서는 generation 증가 → timer/큐/완료 callback 무효화 → 미래 voice 즉시 stop → 활성 voice 10 ms fade → UI paused/ready 갱신이다. 사용자 수정 중 비교였다면 “음이 바뀌었어요. 다시 비교해 주세요.”를 한 번 알린다. 세션을 변경하지 않는 SELECT_SLOT만으로 의미 없이 음을 교체하지 않는다. pointercancel/lostpointercapture/blur는 preview를 종료한다.

`hidden`, `pagehide`, running 외 context state에서는 위 취소와 함께 session-save command를 보낸 뒤 suspend를 시도한다. suspend가 reject되어도 UI는 paused이며 schedule 금지다. `visible/pageshow`에서는 “작업은 그대로예요. 다시 듣기를 누르면 재생돼요.”만 표시하고 자동 resume/start는 0회다. 장치 변경을 감지할 수 있으면 같은 경로로 큐를 폐기한다. 실제 기기 이벤트를 브라우저 에뮬레이션으로 대체 검증했다고 쓰지 않는다.

## S06 공용 scheduler

- 조회 25 ms, lookahead 100 ms, 최소 예약 여유 5 ms. 시간의 단위는 초와 밀리초를 API 이름으로 구분한다.
- tick 시작 시 hidden/state/token을 확인한다. horizon 내 이벤트를 먼저 모두 검사한다. 하나라도 `event.at < ctx.currentTime + .005`이면 해당 transport 전체를 중단하고 “재시작”을 요청한다. 같은 tick에서 먼저 몇 음을 내보낸 뒤 late event를 발견하지 않게 한다.
- 같은 시작 시각·groupId의 화음은 한 묶음으로 예약한다. 뒤늦은 이벤트를 currentTime으로 옮기거나 몰아서 내보내지 않는다.
- UI 위치는 audio clock에서 계산한다. rAF 중단은 예약에 영향을 주지 않는다. `getOutputTimestamp()`는 있을 때만 표시 보정에 사용하며 없으면 currentTime/정적 표시로 내려간다. baseLatency/outputLatency는 진단값만 기록한다.
- 마지막 note tail과 transport duration을 구별하고 끝나면 timer·queue·subscription을 정리한다. auto loop 없음.

## S10 교대 합주: 정확한 데이터

템포 80 BPM, 4/4, 한 박 .75초, 한 마디 3초, 본문 24초, transport 24.4초. 주문 진행 순서와 합주 순서를 혼동하지 않는다.

| 마디 / 시작 | 주문 | 화음 | root / third / fifth MIDI |
|---|---|---|---|
| 1 / 0 | CR01 | C | 60 / 64 / 67 |
| 2 / 3 | CR02 | Cm | 60 / 63 / 67 |
| 3 / 6 | CR03 | F | 65 / 69 / 72 |
| 4 / 9 | CR06 | Fm | 65 / 68 / 72 |
| 5 / 12 | CR05 | G | 67 / 71 / 74 |
| 6 / 15 | CR04 | Gm | 67 / 70 / 74 |
| 7 / 18 | CR08 | Fm | 65 / 68 / 72 |
| 8 / 21 | CR07 | C | 60 / 64 / 67 |

앞 7마디의 상대 초 패턴:

| 파트 | 시작 | gate | release 포함 종료 |
|---|---|---|---|
| root | 0, 1.5 | 1.05 | 1.17, 2.67 |
| third | .75, 2.25 | .60 | 1.47, 2.97 |
| fifth | .375, 1.125, 1.875, 2.625 | .225 | .72, 1.47, 2.22, 2.97 |

마지막 마디는 21.0초에 3음, gate 2.625초, gate 끝 23.625초, release 끝 23.745초다. 24.4초는 transport 종료이며 note gate가 아니다. `7 * (2 + 2 + 4) + 3 = 59`개 musical note event다. 부분음 oscillator 수와 구별한다. root 15, third 15, fifth 29개. 모든 이벤트에 `gateEnd + .12 <= nextBarStart - .01`을 검사한다. 최소 여유는 30 ms이고 마지막 third와 fifth 모두 이 경계에 도달한다. 미래 tempo 변경 시 재검사한다.

2026-10-19 별도 산술 계산 결과: 59개, 파트 15/15/29, 최소 경계 여유 0.029999999999997584초(부동소수), 마지막 tail 23.745초. 이는 원문 수치 교차 검산이며 아직 앱 event generator나 오디오 실행 테스트 결과가 아니다.

음색 선택안은 root=pluck, third=reed, fifth=bell. 외부 녹음 없이 기본음이 분명한 자체 integer-harmonic 합성으로 시작하며 config version과 peak 검사를 각각 둔다. 음정·동일 release 경계를 바꾸지 않는다. panning은 MVP에서 생략해 mono 보존을 단순화할 수 있다. 약한 panning을 추가하면 mono downmix도 렌더한다.

solo/mute 규칙 제안: solo 집합이 비어 있으면 unmuted 전체, solo 집합이 있으면 `solo && !muted`만 재생(mute 우선). 재생 중 변경은 현재 transport를 취소하고 다음 명시적 전체/파트 듣기로 새 필터를 적용한다. 자동 재시작하지 않는다. UI에 이 행동을 알리고 현재 들리는 파트를 텍스트로 표시한다. 정지·다른 주문·비교·hidden은 모든 합주 future source를 취소한다.

해금은 CR01~CR08 고유 완료 집합만 본다. 도움/오답/무음/질문 건너뛰기는 제외 조건이 아니다. 반복 완료는 보상을 추가하지 않는다. Sandbox는 별도 local state, MIDI 60~74 및 C/Cm/F/Fm/G/Gm, 평가·progress·attempt·hint 변경 0회이며 진입/이탈에서 transport를 정리한다. 실제 S10 아트·자산 장부는 부모 UI 작업과 조정한다.

## 실행할 검증과 남길 증거

| 층 | 실제 실행할 검사 | 증거 / 한계 |
|---|---|---|
| pure/config | MIDI 15개 + A4 frequency, Nyquist 경계, finite 입력, envelope endpoint/짧은 gate | Vitest; 실제 음 출력 근거 아님 |
| engine adapter | voice/source 등록·ended·부분 실패 cleanup, stop 멱등, future stop, 25번째 voice, 3음 원자성, 비교 priority, mute ramp native/fallback | 독립 fake audio/wall clock; schedule log·최대 registry 수 |
| context lifecycle | lazy singleton, StrictMode setup-cleanup-setup, resume reject/pending cancel, closed 재생, hidden/return, sine fallback 최대 1회 | factory/resume/start/listener 호출 수 |
| transport | `.05/.95/1.35/2.25/2.40`, 동일 timbre/gain/velocity/gate, snapshot 변경 불가, edit/undo/reset/order/10연타, 완료 stale 방지 | generation별 event log |
| scheduler | 25/100ms, late event 전체 정지, rAF 정지 영향 0, audio/wall clock 독립 | timer log, scheduled source start 시각 |
| ensemble | 59 events, 15/15/29, 순서, 8마디, gate/release 모든 경계, 23.745 tail/24.4 end, solo/mute/stop/해금 | event dump JSON과 ENS 회귀 |
| 실제 브라우저 | 사용자 click 후 running·C4/Eb4/E4/G4 schedule, locked 방문 자동 start 0, pause/return 자동 start 0, pointer cleanup | Playwright 실제 browser trace; 청취와 별개 |
| OfflineAudioContext | 같은 createVoice/mixer 경로로 여러 sampleRate와 master 조합 렌더, 모든 sample finite, nonzero audible case, mute 무음, peak <= -1 dBFS | 브라우저/version/sampleRate/config/peak/channel 기록 |
| 실제 기기 | iOS/Android와 내장·유선·Bluetooth, 전화/잠금/앱전환30초/장치변경/브라우저 mute/음량0/저전력 | 확보 전 NOT RUN/BLOCKED; 에뮬레이션으로 PASS하지 않음 |

Offline 검사는 Node fake context만으로 처리하지 않는다. Playwright가 로컬 5486(최종 production은 4486)을 열고 테스트 전용 ESM harness를 통해 실제 `OfflineAudioContext`를 실행한다. production bundle에는 harness를 포함하지 않는다. 44.1kHz/48kHz, mono와 stereo 사용 시 양 채널, master .35 및 1에서 6개 reference 화음·비교·합주 음색·24 voice 동시 stress·mute/stop을 렌더한다. `max(abs(sample))`, dBFS, RMS, NaN/Infinity 수, 마지막 tail 이후 residual, 최소/최대 sample을 JSON으로 보존한다. 단순 peak만 맞춘 완전 무음 구현이 통과하지 않도록 nonzero RMS와 주파수 존재도 검사한다. 비교의 Eb/E 차이는 별도 구간의 기본주파수 검출로 확인한다. 브라우저마다 float 결과 차이는 합리적 수치 tolerance로 처리하되 peak 기준을 완화하지 않는다.

실행 시 명령은 `npm run test:audio`, 관련 unit/E2E, `npm run typecheck`, `npm run build`와 테스트 runner의 실제 브라우저 프로젝트를 기록한다. 아직 테스트 파일이 없으면 성공으로 보고하지 않는다. 로그/trace/offline JSON은 `docs/qa`에서 경로를 가리키고 `docs/handoffs/S05.md`, `S06.md`, `S10.md`에 수행 날짜·실행 명령·exit code·검사 수·미실행 항목을 남긴다. 생성된 소리가 사람 귀에 들렸는지, 모바일 기기에서 정상인지, 음압이 안전한지, 입력→스피커 p95가 목표인지에는 별도 실제 관찰·외부 측정이 필요하다.

## 착수 시 먼저 확인할 사항

1. S04 실제 `AudioPort`/gesture cleanup과 S03 취소 명령 이름을 읽고 위 API를 그 경계에 맞춘다.
2. parent의 S04 통과 통지 후 S05만 구현·검증하고 API/한계를 인계한다. S06·S10은 선행 단계 완료 뒤 진행한다.
3. browser binary와 실행 권한, 실제 모바일 접근 가능 여부를 확인하고 부족한 검사는 분리 기록한다. 승인 없는 새 자격증명·권한·유료 서비스는 사용하지 않는다.

## S03/S04 실제 계약 확인 — 2026-10-19 후속

부모의 S03 PASS(99 tests) 통지 후 `src/domain/session/types.ts`, `reducer.ts`, `docs/session-contract.md`, `docs/handoffs/S03.md`, `src/ui/services.ts`, `NoteInput.tsx`를 실제 읽었다. S04는 현재 구현 중이며 구현 착수 게이트는 아직 닫혀 있다. 아래 내용은 위의 제안 API보다 UI 통합 시 우선한다.

```ts
// src/ui/services.ts의 현재 계약과 구조가 같아야 한다.
type AudioSnapshot = Readonly<{
  orderId: string; attemptId: string; revision: number;
  original: readonly number[]; current: readonly number[];
}>;
type WorkbenchServices = {
  enable(): Promise<boolean>;
  previewNote(midi: number): void;
  playOriginal(snapshot: AudioSnapshot): void;
  playCurrent(snapshot: AudioSnapshot): void;
  compare(snapshot: AudioSnapshot): void;
  arpeggiate(snapshot: AudioSnapshot): void;
  stopAll(): void;
  status(): string;
  // onCommand은 현재 UI의 선택적 session bridge이며 오디오 엔진 자체 책임이 아님.
};
```

- AudioSnapshot에는 `key` 중첩 객체를 요구하지 않는다. 그 세 필드를 그대로 복제/비교한다. 배열은 caller 소유이므로 readonly 타입만 믿지 말고 호출 시 복제한다. app adapter에서 내부 SnapshotKey를 만들 수 있다.
- `enable`은 context 준비 결과일 뿐 “들렸음”을 뜻하지 않는다. preview/transport의 void wrapper는 내부 Promise의 rejection을 잡아 상태에 반영한다. 사용자 handler에서 context 생성/resume을 즉시 호출하고 이후 Promise 완료에서 token을 확인한다. unhandled rejection을 만들지 않는다.
- AudioService는 `status(): AudioStatus`, `subscribe(listener): () => void`, `setVolume(number)`, `setMuted(boolean)`를 별도로 제공한다. state 변경 때만 구독자를 한 번 알리고 cleanup은 멱등 처리한다. root app bridge가 구독 후 `SET_AUDIO`를 전달하거나 안정적인 status snapshot으로 `useSyncExternalStore`를 사용할 수 있다. UI `WorkbenchServices`에 필수 메서드를 무단으로 추가하지 않는다.
- app 진입점의 안정적인 인스턴스 한 개를 전달한다. 렌더 때 새로운 wrapper 객체를 만들면 NoteInput effect의 `[services]`가 바뀌어 cleanup `stopAll()`이 불필요하게 반복되므로 adapter 객체도 안정적으로 유지한다.
- 실제 NoteInput은 pointerdown에서 `previewNote`, pointercancel/lostpointercapture/blur/pagehide/unmount에서 `stopAll`을 호출한다. pointerup에는 현재 명시적 stop이 없으므로 350 ms 이하 gate와 자연 종료를 반드시 보장한다. 정상 pointerup→click note 편집은 S03 `CANCEL_AUDIO` 명령으로 이전 비교를 취소한다. 같은 MIDI 재선택은 revision 증가나 cancel 명령이 없을 수 있어도 preview는 자동 종료된다.
- S03 `CANCEL_AUDIO`는 인자 없는 명령이다. root가 `stopAll()`로 매핑한다. 비교 중 편집 안내는 root가 명령 이전 transport mode 또는 이전/current snapshot key를 보고 표시할 수 있다. HIDDEN은 `CANCEL_AUDIO` 및 immediate SAVE를 이미 반환하므로 lifecycle의 session event bridge가 이 reducer 경로를 사용한다. RETURN은 음을 요청하지 않는다.
- SessionSettings는 `{mute, volume, inputMode: 'keyboard'|'pads', reducedMotion, notation: 'letters'|'solfege'}`다. root가 mute/volume만 오디오 엔진에 반영하고 다른 설정은 sound scheduling이나 학습 증거를 바꾸지 않는다. 설정 복원·음소거 해제만으로 context를 만들거나 자동 재생하지 않는다.

**초기 음량 불일치 발견:** 현재 읽은 `src/domain/session/reducer.ts:6`의 `DEFAULT_SETTINGS.volume`은 `0.5`다. 설계 초기 master는 `0.35`다. 부모에게 알렸으며 아직 이 준비 작업에서 소스를 고치지 않았다. S05 착수 전 세션 default가 `.35`로 정정되었는지 확인한다. AudioService의 volume default `.35`와 SessionSettings.volume은 동일한 한 개 master 값이다. bridge에서 `setVolume(.35)`를 호출하면 master target은 `.35`이며 `.35 * .35`가 아니다. velocity와 headroom은 별도 음악적 스케일이고 사용자 master를 또 곱하지 않는다. 현재 사용자 설정이 이미 있다면 그 값을 존중한다.

### S05의 구체적인 구현 순서

1. `types.ts`에 AudioState, priority, config v1, note event/group, voice handle, runtime/diagnostics 인터페이스를 정의한다. 음악 주파수는 이미 있는 S01 함수를 import한다. 앱/도메인의 정답·content Order는 엔진에 import하지 않는다.
2. `tests/audio/fake-audio.ts`에 AudioParam automation log, source start/stop/ended, 부분 생성 실패, connect/disconnect 계수, 상태 이벤트, 수동 audio clock을 갖는 좁은 fake adapter를 둔다. Vitest wall clock은 별도로 조작한다. 전역 any를 사용하지 않고 필요한 Web Audio surface를 작은 타입으로 정의한다.
3. engine red 테스트를 먼저 실행해 근거를 남긴다. frequency/15 MIDI, harmonic Nyquist 및 정규화, short gate, envelope endpoints, invalid duration, 음당 sources 묶음, idempotent cleanup, volume 단일 적용, native/fallback gain ramp를 우선한다.
4. `envelope.ts`는 pure envelope/ramp 계산과 AudioParam 적용, `create-voice.ts`는 `BaseAudioContext`의 oscillator 생성과 normalized partials, `mixer.ts`는 master/voice 예산을 담당한다. 같은 경로를 OfflineAudioContext가 사용한다.
5. `AudioService.ts`는 lazy context, 준비 요청 token, generation, priority group admission, voice registry, snapshot 상태 구독을 소유한다. 새 note는 예약된 source까지 포함한 registry가 24 이하여야 한다. 8 ms eviction fade 중에는 새 source를 미리 registry에 넣지 않고 pending logical request로 보관한다. 실제 slot 해제 후 유효 token이면 fresh absolute audioTime으로 admission한다. high-priority 3음은 항상 모두 수용하거나 모두 보류/거절한다.
6. `enable`, `previewNote`, `stopAll`, `status`, `subscribe`, `setMuted`, `setVolume`을 검증한다. S06 transport 메서드를 S05에서 미리 구현하거나 placeholder를 구현 완료로 표시하지 않는다. S05의 브라우저 검사는 test harness의 명시적 클릭 handler로 C4/Eb4/E4/G4를 요청할 수 있다. 실제 UI transport 연결은 S06 단계가 소유한다.
7. lazy factory 횟수·StrictMode attach/detach·pending resume 취소·resume reject·closed 재생·unavailable·sine fallback 1회·24 voice 상한·예약 취소를 실행한다. 이 시점 lifecycle helper의 listener 등록/해제는 engine 소유 범위만 검증하고 hidden/pagehide와 세션 저장 연결은 S06에서 한다.
8. 실제 브라우저 OfflineAudioContext 측정 후 `docs/audio-contract.md`, `docs/handoffs/S05.md`에 값과 명령을 기록한다. 공유 implementation-status는 부모가 갱신한다. S05 통과 통지를 받은 뒤 S06의 snapshot/transport/lifecycle 구현을 시작한다.

### 준비된 브라우저 환경

부모가 다운로드 및 최소 셸 실행을 확인한 엔진은 Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2이고 binary 위치는 작업 루트 `task-4/playwright-browsers`다. `127.0.0.1:5486` 서버가 실행 중이라는 인계를 받았다. 현재 Playwright config는 Chromium project 하나이므로 Firefox/WebKit을 실제 실행하려면 해당 project/runner를 별도로 지정하고 결과를 기록해야 한다. 다운로드되어 있다는 사실을 실행 통과로 쓰지 않는다.

부모 환경에서는 browser와 dev server가 동일한 `require_escalated` 네트워크 namespace에서 실행되어야 했다. 실행 전에 살아 있는 서버와 해당 환경을 확인한다. localhost 접속 실패를 앱 결함으로 오인하거나 port를 5486/4486 외로 바꾸지 않는다. 브라우저는 테스트 page에서 `/src/audio/...` 모듈을 dynamic import하여 실시간 엔진과 같은 voice/mixer 함수를 OfflineAudioContext에 연결할 수 있다. browser.evaluate 계산은 실제 engine의 렌더/자동화 검증이며 물리적 청취·실기기 검증으로 보고하지 않는다.
