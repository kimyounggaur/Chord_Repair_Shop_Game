# 알려진 한계와 미검증

| 항목 | 영향·현재 대응 | 상태 |
|---|---|---|
| 물리 모바일 오디오 | OS interruption/전화/출력 전환/저전력/Bluetooth는 브라우저 자동화로 확인할 수 없음 | 실제 기기 게이트 NOT RUN |
| 사람 청취·출력 지연 | PCM과 scheduled source는 스피커에서 들림/안전 음압/사용자의 장단 식별 결과가 아님 | NOT RUN |
| VoiceOver/TalkBack/OS 큰 글자 | DOM·keyboard·axe·CSS 확대는 완료 경로의 실제 AT 사용을 대체하지 않음 | NOT RUN |
| Windows Playwright WebKit API | 이 바이너리에 AudioContext/OfflineAudioContext 없음. 무음 학습과 불가 안내로 계속 | native15개 NOT RUN, 실제 Safari 미확정 |
| 저장 수명 | 비공개 모드/용량/데이터 삭제/다른 origin으로 기록 소실 가능 | 배너·memory fallback·export/backup 제공; 영구보관 없음 |
| offline 장식 이미지 | 아직 받아놓지 않은 다른 손님/수리완료 그림은 연결 차단 뒤 안 보일 수 있음 | 핵심 DOM/판정/소리/저장/합주 PASS. 재실행 PWA 없음 |
| 입력 성능 | 초기 부하 측정에서 p95 목표 초과와 미리듣기 누락을 발견해 clock-step/예약 경로 수정. 최신55/55 표본은 목표 내 | 호스트 변동/실기기 반응은 추가 확인 필요 |
| 연구/권리 최종 판단 | 사용성 관찰·교육효과·독립 음악교육 검수·최종 상표/법률 확인 없음 | 정식 출시 게이트 미완료 |
| 운영 rollback | 첫 프로젝트 배포라 이전 정상 운영 deployment 없음 | 절차 준비만, 실제 rollback NOT RUN |

확인된 소프트웨어 결함과 테스트 자체의 동기화 문제는 [QA 보고](../qa/test-report.md)의 실패→수정→재시험 증거로 구분한다. 새 결함을 이 목록의 '환경 한계'로 숨기지 않는다.
