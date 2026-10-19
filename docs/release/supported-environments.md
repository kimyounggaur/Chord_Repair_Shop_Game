# 검증 환경과 지원 범위

현재 후보는 **개발 후보, 출시 준비 미완료**다. [실제 기기 표](../qa/device-matrix.md)의 Windows Playwright Chromium156.0.8078.4/Firefox157.0/WebKit27.2에서 검사했다. WebKit27.2 Windows 바이너리는 native Web Audio API가 없어 무음 경로와 불가 안내만 확인했다. iOS Safari·Android Chrome·macOS Safari 지원 버전은 아직 확정하지 않았다.

320/390/768px와 가로 화면, 키보드, 네이티브 touch emulation, CSS zoom200/400, reduced motion, 자동 대비·axe 검사를 수행한다. 물리 터치·OS 큰 글자·VoiceOver·TalkBack·전체 WCAG AA 적합의 증거가 아니다. 최신 실행 결과는 [QA 보고](../qa/test-report.md)를 따른다.

음악 엔진의 실제 PCM·예약·취소를 Chromium/Firefox에서 검증했지만 사람 청취, 전화/잠금/30초 앱 전환/출력 경로 변경/저전력은 실기기에서 수행하지 않았다. 실제 스피커 지연과 음압 안전을 수치로 보증하지 않는다.

IndexedDB를 허용하지 않으면 메모리 경로로 계속할 수 있고 내보내기를 제공한다. 새로고침 뒤 메모리만의 기록은 유지되지 않는다. 로드 후 offline 학습·합주·저장은 확인했지만 새 장식 이미지 및 offline 재실행은 보장하지 않는다. 별도 PWA 캐시는 없다.
