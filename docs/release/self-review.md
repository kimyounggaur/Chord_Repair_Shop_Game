# 최종 후보 자체 점검

검토 방식: 원본/프롬프트 전체 요구와 실제 소스·테스트·증거 대조. 새로운 독립 검토자를 투입한 감사는 아니다. 이전 도메인 준비 검토는 각 단계 이력이며 최종 후보의 독립 검수로 대체하지 않는다.

Vercel React Best Practices 스킬의 조건부 await, stable subscription/listener, transient ref, lazy initialization, functional setState, bundle 항목을 적용해 확인했다. App은 순수 session reducer와 command를 연결하고 음악·판정·저장·오디오를 별도 모듈로 둔다. useSyncExternalStore의 snapshot/subscription과 서비스 객체는 안정되어 있고, 단일 lazy AudioContext는 렌더/StrictMode 구독 시 생성하지 않는다. 전역 lifecycle/DOM listener는 cleanup 경로가 있으며 실제 반복 수는 soak에서 검사한다. 제스처 처리와 노출 증거 변경은 명시적 이벤트에 있다. server/SSR/remote-fetch 관련 규칙은 이 정적 SPA에 해당하지 않는다.

| 영역 | 코드 확인 | 실제 증거와 한계 |
|---|---|---|
| 음악 | letter-first triad, strict pitch, MIDI multiset, bass inversion, spelling/register 분리 | literal oracle와 순열/음역/이명동음 테스트. 교육 담당자 검토 별도 |
| 판정 | order ID로 정답 반환하지 않음; 오답/불완전/앱 오류 분리 | grading negative fixture와 실제8주문 흐름 |
| 학습 | 첫 제출/질문/도움/노출 이력 단조, 새 연습/복원 구분 | session/learning/storage. 실제 사람 관찰 미수행 |
| 오디오 | 단일context, 동일 비교 envelope, generation, finite preview, 모든 source 정리 | 198 tests의 audio 및 native148 renders. 실제 청취 미수행 |
| 저장 | CAS/lease/atomic backup/strict import, 손상 원본 자동 삭제 없음 | 실제 IDB reload/두탭/손상, injected quota. 실제 공간 소진 아님 |
| UI | native button/keyboard/labels/visible focus/모달 focus, CSS 반응형 | axe/DOM/모바일 screenshot, 실기기 AT 별도 |
| 범위·권리 | 무계정·무분석·권한 비요청, 제공 아트hash와 장부 | 보안 자체 검토. 최종 상표·법률 확인 미수행 |

S11에서 발견한 결함의 재현/수정/회귀는 [QA 보고](../qa/test-report.md)에 남긴다. 최종 clean198+144와 실제20분356회 PASS를 확인한 뒤 S13 판단표를 확정했다. 이 문서만으로 실제 기기·사람 관찰·독립 검토 게이트를 통과했다고 판단하지 않는다.
