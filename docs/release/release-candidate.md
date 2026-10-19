# 출시 후보 판단

판정: **개발 후보, 출시 준비 미완료**. 요청된 게임 구현과 별도 배포를 위한 후보이며 정식 교육 제품의 출시 승인을 의미하지 않는다. 현재 코드는 clean198개 단위·통합·오디오, E2E117, 접근성27, production 기능/offline/실제20분356회 검사를 통과했다. 실제 증거는 [QA 보고](../qa/test-report.md)에 있다.

앱1.0.0/contentVersion1.0.0/schemaVersion1. `scripts/build-release.mjs`가 앱 코드·빌드 설정·원본 콘텐츠·제공 자산 manifest·lockfile SHA를 묶어 releaseId를 생성한다. `dist/release.json`의 artifact 목록은 자기 자신을 제외한 모든 정적 파일의 path/SHA를 정렬한 목록이다. 이 목록의 hash와 실제 파일 bytes를 운영 URL에서 대조한다. 전체 dist의 release.json까지 포함한 외부 검증 manifest는 clean-run evidence에 별도로 보존한다. Git SHA는 VERCEL_GIT_COMMIT_SHA 또는 실제 HEAD를 쓰며 없으면 null이다.

현재 후보 releaseId: `chord-repair-1.0.0-fcbf1d928d2155ef`. artifact manifest: `16b9bafb1fc3af0507083ca6dcfb471f946ba21074febd4cce043c825e1b5954`. 최종 복사 manifest와 clean summary를 함께 확인한다. 이 문서 작성만으로 Git push/배포 READY를 주장하지 않는다.

## 원본24장12개 체크리스트

| 원문 항목 | 판단 | 근거/열린 게이트 |
|---|---|---|
| 8주문의 시작·목표·MIDI·질문이 부록A와 일치 | PASS | 원본 byte/hash, reference, content validator, literal oracle |
| CR01 E♭→E 수리와 실제 소리 변경 | PASS 소프트웨어 / 사람 청취 NOT RUN | native PCM 및 UI original/current/compare, 실제 스피커 청취 없음 |
| 장단·역할·전위·음역·철자 구분 | PASS 자동·자체 검토 | music/grading/unit, 독립 음악교육 검수 별도 |
| 정답 상시점멸·시간압박·수정 감점 없음 | PASS | UI/source/eight-orders, 명시적 도움과 동일 보상 |
| 핵심 탭·패드·키보드 동작 | PASS 자동 / 실기기 NOT RUN | 실제 browser keyboard/touch emulation, 물리 손가락/AT 별도 |
| 비교 동일 음색·음량·음역·길이 | PASS | comparison plan과 native renders |
| unlock·중단·복귀·취소·폭주 실제 기기 | NOT RUN | 자동화에서 해당 경로 확인, 전화·잠금·출력은 기기 미접근 |
| reload·실패·손상·구버전·두탭 복구 | PASS 자동 | 실제 IndexedDB + 일부 강제 오류 주입. 디스크 공간 소진/영구보관 보증 아님 |
| 도움·완료·독립 개념·청음 평가 분리 | PASS 구현 / 연구 NOT RUN | evidence와 회귀, 별도 transfer namespace와 연구 계획 |
| 모순된 장단을 무작정 동시에 합치지 않음 | PASS | 59event/8교대마디, gate+release 경계, 마지막24.4s 종료 |
| 접근성·성능·권리·개인정보 검수 | PARTIAL | 자동 axe/레이아웃/성능/소스·출처 확인; AT/실기기/법률 최종 미완료 |
| 실제/미실행 테스트와 한계 기록 | PASS 문서 | QA·기기표·인계·알려진 한계·연구 템플릿 |

중요한 미완료 게이트는 실제 모바일 오디오/입력·AT·사람 청취·입문자 관찰·음악교육 및 최종 권리/상표 검토다. 장식 부족으로 취급하지 않는다. 음악 오류·진행 삭제·자동 소리·독립 증거 오염·핵심 접근성 차단이 발견되면 먼저 수정하고 관련 회귀를 반복한다.

사용자는 현재 PC의 별도 작업 폴더, 지정 GitHub 저장소 commit/push와 별도 Vercel 프로젝트 배포를 명시적으로 승인했다. 이를 개발 후보의 정적 배포 범위로 적용한다. 원본 백업/다른 게임/기존 원격 이력은 보존하고 force push·신규 credential·권한 확대·결제·연구 참가자 연락은 하지 않는다. 배포 사실과 최종 SHA/URL은 S14 인계의 실제 응답으로만 확정한다.
