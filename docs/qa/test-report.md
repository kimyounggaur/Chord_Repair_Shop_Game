# S11 검사 보고

상태: 최종 clean 회귀·production·실제20분 자동 검사 PASS. 물리 기기·사람 청취·AT·참가자 연구는 NOT RUN이며 자동 결과와 구분한다. UTC2026-10-19, 실제 환경은 [device-matrix](device-matrix.md).

## 실행 증거

| 검사 | 실제 결과 | 증거 |
|---|---|---|
| 원본 대조/타입/자체 lint/build + 전체 Vitest | exit0,12파일198 tests | S11-preview-clock-fixed-check.log |
| 수정 전 clean 회귀 | E2E117 중116 PASS/1FAIL. 이후 단계 중단 | release/2026-10-19T15-23-44-618Z-0ee499/summary.json |
| 수정 전 실패 재현성 | 원래 native assertion12회 PASS, 추가 native 진단12회 정상. clock-step2 regression은 결정적으로 FAIL | S11-preview-repeat12.log, S11-preview-diagnostic.json, S11-preview-clock-before.log |
| 두 번째 clean 회귀 | E2E117 중116 PASS/1FAIL: WebKit 합성 pagehide/lease 인수 경쟁 | release/2026-10-19T15-38-54-737Z-48d0a3/summary.json |
| 실제 두 탭 재검증 | 세 엔진 각2회, 총6 PASS/1.9분 | S11-takeover-verified.log |
| 최종 clean 회귀 | 15:49:09–15:56:54 UTC, 11명령 모두 exit0. 단위100+통합31+오디오67=198, E2E117+접근성27=144 PASS. sourceStable true | release/2026-10-19T15-49-09-895Z-a28fc9/summary.json |
| production8주문/합주/offline/복원 | exit0, 기능 PASS, 외부 요청0/CSP 위반0/pageerror0 | S11-production-qa.json, S11-production-preview-fixed.log |
| production 입력·전송·초기화 | 마지막55/55 예약, warmup5+50. 수치와 초기 실패 이력 별도 | performance.md, build-budget.json |
| 실제20분 | 1205566ms,356회, PASS. 안정 화면 voice0/listener189/timer0, context1, peak voice7. 표본 heap +551924B | S11-soak.json/log |
| 의존성 | npm audit exit0, 취약점0; declared licenses111/unknown0 | S11-npm-audit.json, dependency-ledger.json |

경로가 생겼다는 이유로 검사를 PASS로 세지 않는다. 최종 명령 실행 수·source 안정성·exit code는 summary의 결과를 따른다. 일반 `npm run check`는 E2E/접근성을 포함하지 않으므로 전체 clean 회귀의 대체가 아니다.

콘텐츠25개는 unit100에 포함되므로 별도 content/build 호출의 반복 횟수를198에 더하지 않는다. clean runner의 outstanding은 이 명령 묶음 밖에서 확인할 체크리스트이며 실제 현재 결과는 이 보고와 S12–S14 인계를 따른다. 실행 중 source SHA는 `ceba249d154ff649459ff1577f1051dd275824eee8eb69601341cc2d1daece2c`. 앱 identity와 별도의 test/script 포함 snapshot이다. clean 이후 배포 검사 harness에 MIME/cache/실제 route reload assertion과 결과 경로 옵션을 추가했으며 앱/콘텐츠/빌드 산출물은 변경하지 않았다. 배포 harness의 실제 결과는 S14에서 기록한다.

## 재현 후 수정한 문제

1. S06 frozen AudioContext에서 예약된 정지시각에 도달하지 못한 node가 남음: 실제 노드 stop/disconnect와 suspend 완료 대기, late enable guard. 관련 native/단위 회귀는 S06 인계에 보존.
2. S09/S10 모달·label: 확대 시 닫기 노출, Escape/Tab/return focus, 화면 음 기호를 accessible name에 포함. wcag21a 검사 태그를 줄이지 않고 수정. WebKit click의 포커스 차이는 trigger 명시적 focus와 렌더 시 return target 보존으로 수정.
3. S11 Firefox OfflineAudioContext: render Promise보다 늦게 오는 ended callback을 bounded1500ms로 기다린 뒤 기존 음성 정리 assertion 유지. 파형/음고/peak 검사를 완화하지 않음.
4. S11 미시작 home의 hidden 저장이 가짜 CR01 attempt를 만듦: 설정만 보존하고 실제 START_ORDER 전 attempt를 만들지 않는 회귀 추가.
5. S11 이전 commit 완료 문구가 새 dirty 기록에도 남음: 최신 sequence가 commit된 경우만 clean, 대기/진행 문구 구분. 실제 WebKit reload 보존10개 검사를 통과.
6. S11 preview clock-step: native 첫 clean의 간헐 실패 trace에서 running/context1/generation5임에도 예약0을 확인. 이전 code는16ms clock step에서10ms lead를 놓치고 조용히 거절할 수 있음을 결정적으로 재현. 이미 running이면 동기 예약, 설계 범위 내20ms lead, 늦은 요청은 재시도 안내. 40ms 늦은 요청은 catch-up 없이 정지 상태 유지. 관련2개 회귀와 전체198 통과. native 첫 실패의 모든 host 원인을 단정하지 않고 trace를 보존.
7. 두 탭 테스트의 합성 pagehide는 첫 문서를 실제로 숨기거나 종료하지 않아5초 lease renewal이 계속되고, 비동기 release 전에 인수할 수도 있었다. 제품의 writer 보호를 완화하지 않고 실제 about:blank 이동 후 native IDB에서 lease 해제 또는 실제15초 만료를 관찰한 뒤 명시적 인수한다. clock을 바꾸거나 lease를 강제 삭제하지 않는다. 세 엔진6회 모두 통과했고 실제 소요15.8–17.5초는 unload write 미완료에 대한 만료 fallback을 포함한다.

## 범위와 미실행

실제 browser AudioContext/OfflineAudioContext는 Chromium과Firefox에서 실행한다. 각 엔진의28 matrix+30 frequency+4 silence+12 timbre =74 native render 기록이며 총148개다. Windows WebKit에 오디오 API4종이 모두 없음을 실제 capability probe로 확인했으므로15 native 사례를 명시적으로 제외하고 무음/불가 안내·UI·저장·접근성을 검사한다. 이를 WebKit 오디오 PASS나 실제 iOS 결과로 표시하지 않는다.

QuotaExceededError는 실제 IDBObjectStore.put에 오류를 주입했다. 기기 디스크를 실제 채우지 않았다. 일부 lifecycle/pointercancel은 합성 이벤트, touch/keyboard 경로는 native browser input이다. legacy migration은 승인된 필드 결측을 unknown으로 옮기는 제한된 migration이며 임의 미래 schema 호환이 아니다.

물리 iOS/Android/Safari, VoiceOver/TalkBack, 실제 손가락 pinch·회전, OS 큰 글자, 전화/미디어 중단·30초 앱 전환·출력 변경·저전력·시스템 mute/음량0, 내장/유선/Bluetooth 지연, 사람 청취와 음악교육 관찰은 NOT RUN이다. 교육효과·청음 성취·WCAG AA 적합·법률 최종 확인을 주장하지 않는다.

요구별 대응은 [REQ01–28/부록D/실패12개 매핑](../requirements-traceability.md). 초기에 실패한 로그/JSON은 진단 이력이며 최신 성공 결과와 분리한다. 실험한 모든 저장 파일은 새 격리 QA 프로필의 합성 기록이다. 사용자의 실제 학습 기록을 읽거나 바꾸지 않았다.
