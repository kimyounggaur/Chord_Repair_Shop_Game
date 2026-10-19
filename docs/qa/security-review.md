# S11 보안·권리 자체 검토

2026-10-19 UTC. 범위는 이 저장소의 정적 MVP와 격리된 QA 데이터다. 침투 테스트·법률 의견·독립 검토 완료를 의미하지 않는다.

| 검토 | 근거 | 결과 |
|---|---|---|
| 정적 콘텐츠 | src/content/loader.ts, build의 verify:reference/test:content | 원본 8주문 고정, unknown key/잘못된 enum/MIDI/도달성/중복 JSON key 거절 |
| 일반 판정 | src/domain/grading/grade.ts | 주문 ID별 정답 반환 없음. 입력과 목표의 다중집합·철자·음역·전위를 각각 검사 |
| import | persistence/schemas.ts, import-export.ts; integration/persistence.test.ts, import-fuzz.test.ts | 읽기 전 262144B 상한, UTF8 재검사, 배열·깊이·키 상한, prototype/accessor/sparse key 거절. 결정적 600개 변형과 유효 roundtrip 검사 |
| 저장 파괴 방지 | repository.ts; persistence/recovery E2E | 원자 쓰기, revision/lease, 손상 원본 보존, 명시적 import/복구 전 backup. 성공하지 않은 최신 저장을 완료로 표시하지 않음 |
| 코드 실행/전송 | src 전체 검색과 자체 코드 읽기 | fetch/XHR/WebSocket/sendBeacon/eval/Function/dangerouslySetInnerHTML/getUserMedia/geolocation/serviceWorker/document.cookie 사용 없음 |
| 네트워크 실제 동작 | S11-production-qa.json | 실제 production 브라우저의 외부 origin 요청0, pageerror0, CSP 위반0. 같은 origin의 HTML/JS/CSS/아트만 요청 |
| 권한 | vercel.json + 4486 실제 응답 | microphone/camera/geolocation/payment/usb/bluetooth 비허용. 로그인·분석·광고·결제·클라우드 학습기록 전송 없음 |
| CSP | vercel.json, 실제 production QA | script/font/connect self, object none, base/frame/form 제한. style unsafe-inline은 피아노 위치·진행 표시의 React style용; script unsafe-inline/eval 없음. img data/media blob 예외는 로컬 표시에 한정 |
| 의존성 | package-lock.json, dependency-ledger.json, S11-npm-audit.json | exact pin + integrity, 111개 declared license, unknown0. 실행 시점 npm audit 취약점0. 무결성/라이선스 표시는 영구 안전 보증 아님 |
| 런타임 notices | public/licenses/THIRD_PARTY_NOTICES.md | React/react-dom/scheduler의 실제 배포 라이선스 포함. dev 도구와 번들 런타임 구분 |
| 제공 아트 | public/licenses/{asset-ledger.json,art-provenance.md}, source-manifest | 사용자 제공 원본 hash와 runtime 50파일/735434B 일치. 원본 장부 별도 보존. 실제 사용 33개·복사만 17개 구분 |
| 개인정보 | export schema + runtime 검토 | 앱에 실명/이메일/위치/device ID/오디오 녹음 필드 없음. export에서 draft/undo/lease/audio 제외. 로컬 오류를 외부로 보내지 않음 |
| CI | .github/workflows/check.yml | contents:read, persist-credentials:false, 공식 v7 action을 커밋 SHA로 고정. 실제 GitHub Actions 실행 결과는 별도이며 준비만으로 PASS 주장하지 않음 |

공개 사이트의 정적 호스팅 제공자는 요청 처리에 필요한 접속 메타데이터를 처리할 수 있다. 앱 자체의 학습기록 전송 없음과 호스팅 사업자 전체의 데이터 처리 없음을 혼동하지 않는다. 관련 배포 지역·대상 연령·상표·법률 최종 검토는 NOT RUN이다. 제공 자산의 프로젝트 통합·배포 용도는 확인했으나 독점성·저작권 성립을 보장하지 않는다.

설정 근거: [Vercel headers](https://vercel.com/docs/project-configuration/vercel-json), [Vite SPA rewrite](https://vercel.com/docs/frameworks/frontend/vite). 운영 URL의 실제 헤더·MIME·원격 bytes는 S14에서 별도 검증한다. 정책 문자열 존재만으로 원격 적용을 주장하지 않는다.
