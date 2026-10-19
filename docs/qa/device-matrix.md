# 실제 검증 환경

2026-10-19 UTC. 이 표는 실행 환경의 기록이며 최소 지원 버전 보증이 아니다.

| 환경 | 실제 범위 | 상태/한계 |
|---|---|---|
| Windows 10.0.26200, Intel i9-11980HK, 16 logical CPUs, RAM 63.75GiB | Node 24.14.0/npm 11.9.0, 로컬 5486/4486 | 개발·자동화 호스트 |
| Playwright Chromium 156.0.8078.4 | 실제 브라우저 DOM/IndexedDB/Web Audio/OfflineAudioContext, 키보드·네이티브 touch emulation | 자동 검사. 물리 Chrome/Android 아님 |
| Playwright Firefox 157.0 | DOM/IndexedDB/Web Audio/OfflineAudioContext, 키보드·touch emulation | 자동 검사. isMobile 옵션은 사용하지 않음 |
| Playwright WebKit 27.2 on Windows | DOM/IndexedDB/키보드/레이아웃/무음·오디오 불가 안내 | 이 바이너리에 AudioContext/OfflineAudioContext 없음. native 오디오 15개는 실행 불가로 명시적 제외, 나머지 검사 수행 |
| 화면 | 320px,390×844,768px,가로; CSS zoom 200%/400% | emulation/CSS 확대. OS 글자 확대·브라우저 메뉴 확대·실제 회전 아님 |
| iPhone/iPad Safari, macOS Safari | 미접근 | NOT RUN. WebKit 자동화를 실제 Safari로 보고하지 않음 |
| 실제 Android Chrome | 미접근 | NOT RUN |
| VoiceOver/TalkBack/실제 AT | 미접근 | NOT RUN. axe와 키보드 검사로 대체 주장하지 않음 |
| 사람의 청취, 내장·유선·Bluetooth, 전화/잠금/저전력 | 미수행 | NOT RUN. native PCM/예약 검증은 실제 들림·음압·청각 성취가 아님 |

정확한 실행 결과는 [test-report](test-report.md), [performance](performance.md), `../evidence/S11-capabilities-*.json`에 연결한다. 이 Windows WebKit의 API 부재는 제품이 모든 WebKit/Safari에서 소리를 지원하지 않는다는 의미가 아니다. 추가 기기 검증 없이는 그 지원도 확정하지 않는다. Playwright 엔진과 실제 브라우저의 차이는 [공식 브라우저 문서](https://playwright.dev/docs/browsers)를 참고했다.

실기기 게이트: 첫 unlock, 10연타, 비교 중 수정, 화면 잠금, 앱 전환 30초, 전화/미디어 중단, 출력 변경, 내장/유선/Bluetooth, 저전력, 브라우저 mute/시스템 음량0, closed/interrupted context, 큰 글자와 AT로 8주문/설정/export. 실제 기기 모델·OS·브라우저·AT 버전과 관찰자를 기록하기 전에는 PASS로 바꾸지 않는다.
