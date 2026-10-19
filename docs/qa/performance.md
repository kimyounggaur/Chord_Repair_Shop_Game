# S11 production 성능 측정

도구: `node scripts/production-qa.mjs`, `node scripts/audit-build.mjs`, `node scripts/soak.mjs`. 4486의 정적 production build와 배포용 CSP/권한 헤더로 검사했다. 테스트 계측 코드는 Playwright 격리 context에만 주입되며 제품 번들에 포함되지 않는다.

호스트·버전은 [device-matrix](device-matrix.md). 네트워크: cold cache, 4Mbps down/1Mbps up/100ms latency. Chromium CPU slowdown4, 390×844 touch viewport. 물리 중급 스마트폰으로 환산할 수 없다.

| 지표 | 마지막 측정 | 초기 목표 | 해석 |
|---|---:|---:|---|
| 전체 JS gzip | 106554B | ≤250000B | PASS. 초기 JS보다 보수적인 전체 합 |
| 전체 이미지/SVG | 735434B | ≤5000000B | PASS |
| 작업대까지 전송 | 181918B | ≤1500000B | PASS. navigation+resource transferSize 합 |
| FCP | 2396ms | ≤2500ms 참고 | 실제 첫 paint. 의미 있는 화면의 사람 판단과 별도 |
| 홈 버튼 DOM 준비 | 877.3ms | ≤2500ms | DOM 준비 시각이며 paint 이전일 수 있음 |
| pointerup→두 번째 rAF p95 | 40.4ms | ≤100ms | 마지막 유효50개 PASS. 실제 디스플레이 외부 계측 아님 |
| pointerdown→첫 native source.start 호출 p95 | 2.2ms | ≤30ms | 마지막 유효50개 PASS. 시작 예약 이후 오디오 장치 지연 제외 |
| 실제 스피커 출력 지연 | NOT RUN | 내장/유선 p95≤100ms | 외부 실측·사람 청취 없음; Bluetooth 별도 미측정 |
| 20분 반복 heap/voice/listener/timer | 1205566ms/356회, PASS | 지속 증가 없음, voice≤24 | context1, peak7, 안정 voice0/listener189/timer0, heap +551924B |

입력 조건: native CDP touchStart/touchEnd, 접촉80ms, 워밍업5회 뒤50회. 표본별 값·55/55 예약 여부와 artifact index hash는 `S11-production-qa.json`에 저장했다. 취소된 preview는 0ms 성공으로 포함하지 않는다.

초기 발견도 보존했다. 접촉 시간이 사실상0인 Playwright tap에서는 일부 예약이 없어졌고, 4배 CPU 조건의 p95 paint는 최대208.6ms였다. 80ms 접촉 첫 실행도 paint123.3ms, 예약 표본 하나 누락이었다. 취소 가능한 비동기 준비와10ms lead의 시계 진행에 대한 취약성을 조사했다. 16ms clock step의 결정적 회귀를 추가하여 실패를 재현한 뒤, 이미 running인 context의 동기 예약과 설계 허용 범위의20ms lead로 수정했다. 더 늦은40ms step에서는 소리를 몰아 재생하지 않고 재시도 안내를 표시한다. 새 빌드의55/55 예약과 마지막 고정 조건 값이 위 표다. 기존 실패 JSON/log를 삭제하거나 최종 PASS로 덮어 쓰지 않았다. 호스트 변동과 실제 매우 짧은 탭의 사용자 경험은 실기기 확인 항목이다.

20분 방법: 준비 과정을 제외하고 실제 벽시계20분 이상 수정→비교→중간 수정→정지→합주→정지→자유실험→주문 이동. 매분 안정 화면에서 native 음성·타이머·CDP heap/DOM listeners를 기록한다. GC는 표본 비교를 위한 측정 절차이며 제품 메모리 정리 코드가 아니다. CPU emulation은 이 장시간 검사에 적용하지 않는다. 첫1분 이후 heap5MB/listener20/timer2 증가가 넘으면 INCONCLUSIVE로 남기도록 검사한다.

완료 시각16:00:00 UTC. 첫 안정 heap5183332B→최종5735256B(+551924B), 마지막5분은5783952→5735256B이며 listener189/timer0는 유지되었다. native peak voice7, 종료시 voice/oscillator0, context1, 앱의 lease renewal interval1. 이 유한한20분 표본은 무한 실행의 leak 부재 보장이 아니다. 최종 index SHA `f393846ddcf02a6252680ff2d6a28afcdfa2353d8c755b1ec50162fe8b9c271e`는 production 기능/성능 측정과 같다. 이전 후보의11분 중단 기록은 `S11-soak-prior-candidate-interrupted.*`에 보존하며 PASS로 세지 않는다.

네트워크 차단 후8주문·실제24.4초 합주·IndexedDB 기록을 수행했고 온라인 복귀 후 reload8/8을 확인했다. 아직 내려받지 않은 장식 이미지는 offline에서 실패할 수 있지만 DOM 조작·텍스트·판정·오디오·저장은 계속된다. Service Worker/PWA/offline 재실행은 구현 범위가 아니다.
