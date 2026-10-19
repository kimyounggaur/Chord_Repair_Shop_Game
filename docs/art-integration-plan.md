# S10 아트 통합 준비 및 출처 감사

작성일: 2026-10-19 UTC. **준비 문서만 작성했다. 앱/UI 수정, runtime 복사, 이미지 재생성·편집, S10 PASS 판정은 하지 않았다.** 현재 구현 단계와 독립적인 읽기 검토다.

원본 패키지 경로: `C:\Users\kimyo\Documents\Codex\2026-10-19\task-4\sources\assets\chord-repair-shop`.

## 1. 읽은 자료와 직접 확인 범위

패키지 `README.md`, `asset-manifest.json`, `SHA256SUMS.txt`, `docs/integration-guide.md`, `docs/order-art-map.json`, `docs/provenance-and-rights.md`, `docs/visual-review.md`, `docs/asset-theme.css`, `docs/qa-report.json`, `public/licenses/asset-ledger.json`, `source/generation-prompts.json`, `tools/validate-assets.py`, `previews/mobile-integration.html`을 읽었다. `previews/asset-contact-sheet.png`를 이미지로 직접 열어 보았다. 모든 manifest/ledger 항목은 프로그램으로 순회해 대조했다.

| 직접 읽기/검사 | 이번 결과 | 한계 |
|---|---|---|
| runtime 실제 파일 목록과 manifest | 정확히 50개, 누락/추가 없음 | 게임에서 로드했다는 뜻 아님 |
| runtime SHA-256·bytes·개별 budget | 50개 모두 일치, 초과 없음 | 디코딩·렌더링 성능은 별도 |
| source SHA-256 | unique source 35개(생성 PNG15+SVG20), manifest 참조 모두 일치 | 최초 생성 요청을 새로 수행한 것은 아님 |
| runtime와 ledger id/path/hash | 50개 각각 1대1 일치 | 권리 장부 내용의 법적 보증 아님 |
| SHA256SUMS 전체 | 104개 경로/해시 일치 | SHA256SUMS 자체는 이 목록의 대상 아님 |
| 주문 매핑 | 8주문, before/completion 32링크 및 각각의 mobile 대응 존재 | 음악 정답/음색과 연결하면 안 됨 |
| SVG XML 및 위험 문자열 | 20개 XML 파싱, script/text/image/foreignObject/on-handler/href/font 패턴 발견 없음 | 임의 SVG 일반 보안 인증 아님 |
| 접촉 시트 육안 | 낮 작업대, 악기3종×2상태, 손님4명×2표정, 역할3도형×5상태, 아이콘5종 확인 | 브라우저·실기기 screenshot이 아닌 이미지 검수 |

위 PowerShell 읽기 검사들은 exit 0이었다. `validate-assets.py`는 `docs/qa-report.json`을 덮어쓰는 코드가 있으므로 원본 보존을 위해 실행하지 않았다. 패키지의 기존 `422/422 PASS`를 이번 실행 결과로 복사하지 않는다. 치수/알파/색 대비 수치는 manifest와 기존 QA 보고서의 기록이며 이번에는 파일 해시 일치와 접촉 시트만 재확인했다.

## 2. 기준 파일 해시

| 패키지 파일 | SHA-256 |
|---|---|
| asset-manifest.json | `367a6d5b62c73a1264e16c589a24c2b3f95b3832ffb115dbfbd05811fa49f79b` |
| docs/order-art-map.json | `9c22fe4e3a24e92b64342128106e887315af22e6c4b0295d1ec41d0dfddba898` |
| public/licenses/asset-ledger.json | `c114f6b21e00f8bc2747cf1202a56e70184500b6304e1c327c42582a80ff35bb` |
| docs/provenance-and-rights.md | `a5682d20f7d5189d3a7f1564d708ce2e7bbbd1fc9a23d1d33d05f16935f8de28` |
| source/generation-prompts.json | `47b9347a994ca21bd37672df83cd67c255290871004022128a27ff1e2efaf473` |
| docs/qa-report.json | `38986f875f7a9c630a12c20bfae11e2bc200862d4f68ad2921a435340d04ac3a` |

패키지의 design reference는 현재 보존된 설계 SHA `65cfbfda…14221681`, 프롬프트 SHA `7d624832…e1721e`와 일치한다. runtime별 전체 hash는 아래 부록에 실제 manifest에서 추출해 적었다.

## 3. 정확한 주문 연결

| 주문 | customer_id | prop_id | 편집 중 | 완료 후 |
|---|---|---|---|---|
| CR01 | customer-01 | prop-musicbox-a | neutral / original | thanks / repaired |
| CR02 | customer-02 | prop-musicbox-a | neutral / original | thanks / repaired |
| CR03 | customer-03 | prop-pluckbox-b | neutral / original | thanks / repaired |
| CR04 | customer-04 | prop-reedbox-c | neutral / original | thanks / repaired |
| CR05 | customer-01 | prop-pluckbox-b | neutral / original | thanks / repaired |
| CR06 | customer-02 | prop-reedbox-c | neutral / original | thanks / repaired |
| CR07 | customer-03 | prop-musicbox-a | neutral / original | thanks / repaired |
| CR08 | customer-04 | prop-pluckbox-b | neutral / original | thanks / repaired |

이 배정은 패키지가 명시한 제작 선택(`mapping_is_production_choice=true`)이다. 설계 원문이 손님 배정을 고정한 것이 아니다. root/quality/정답 MIDI/음색을 이 표로 계산하지 않는다. 정확한 원본 mapping JSON은 아래 부록 A에 포함했다.

S10 적용 때의 파일 매핑은 `runtime/<category>/<file>` → `public/assets/chord-repair-shop/<category>/<file>` → URL `/assets/chord-repair-shop/<category>/<file>`이다. base path를 사용하는 빌드에서는 앱의 base URL 처리와 일치시킨다. 디렉터리/파일명 대소문자를 그대로 보존한다.

원본 map은 primary WebP 경로다. 모바일 경로는 같은 파일명의 `.webp` 직전에 `-mobile`이 붙는다. 예: `runtime/customers/customer-01-neutral.webp` → `runtime/customers/customer-01-neutral-mobile.webp`. 이 규칙으로 만들어지는 32개 주문별 mobile 참조를 실제 파일 존재 검사했다. SVG에는 mobile 접미사가 없다.

상태 연결은 현재 시도의 세션 상태에서 결정한다. 편집/오답/도움/시범/관계 질문 중에는 neutral/original을 유지하고, 질문 응답 또는 skip 후 완료 커밋 흐름의 completed 상태에서 thanks/repaired를 보여 준다. 과거 progress 완료만으로 새 연습의 편집 화면을 완료 아트로 표시하지 않는다. 도움·무음·질문 오답은 같은 완료 아트를 얻는다.

## 4. 크기와 배포 예산

모든 수치는 압축 파일 실제 바이트이며 decimal B를 사용한다.

| 종류 | 파일 수 | 실제 합계 B | 최대 파일 B | 파일당 상한 B | manifest 치수 |
|---|---:|---:|---:|---:|---|
| 배경 | 2 | 213,566 | 170,478 | 250,000 | primary1440×1080 / mobile720×540 |
| 손님 | 16 | 209,330 | 23,622 | 60,000 | primary384×384 / mobile192×192 |
| 악기 | 12 | 306,180 | 51,382 | 80,000 | primary512×512 / mobile256×256 |
| 역할 토큰 | 15 | 5,017 | 440 | 3,000 | 64×64 SVG |
| 아이콘 | 5 | 1,341 | 287 | 2,000 | 24×24 SVG |
| 전체 runtime | 50 | 735,434 | — | 전체5,000,000 | WebP30+SVG20 |

모바일 WebP15개+SVG20개 합계는 **178,798B**, primary WebP15개만 합계는 **556,636B**다. 원본 PNG, gallery, contact sheet, 제작 스크립트, 원본 manifest/문서는 runtime 초기 전송에 포함하지 않는다. 모든 50개를 public 폴더에 두는 것과 초기 네트워크로 모두 다운로드하는 것은 다르다.

패키지의 `initial_visual_files`는 mobile 배경43,088B + CR01 neutral 손님6,590B + musicbox original16,960B + 토큰15개/아이콘5개6,358B = **72,996B, 23파일**이다. 그림/SVG만의 합계이며 HTML/CSS/JS/폰트·request overhead를 포함한 앱 초기1,500,000B 달성 결과가 아니다. 실제 production 네트워크로 측정해야 한다.

## 5. preload/lazy 적용안 — S10에서 구현할 것

1. 홈에서는 현재 보이는 장식만 요청한다. 모든 주문의 손님/악기·완료 상태·primary/mobile를 일괄 preload하지 않는다. 진행과 입력을 장식 다운로드 완료에 묶지 않는다.
2. 첫 작업대 진입 시 현재 viewport에 선택된 배경과 해당 주문의 neutral/original만 eager 표시한다. 96px 내외 장식에는 mobile 악기256px, 64–96 CSS px 손님에는 mobile192px를 사용한다. 구조상 첫 화면의 주요 그림에만 필요하면 우선순위를 높이며, preload와 실제 img/CSS가 같은 해상도 URL을 사용하도록 해 이중 요청을 피한다.
3. `<picture>`의 media 조건 또는 하나의 명시적 variant 선택으로 mobile/primary 중 하나만 선택한다. `srcset`을 쓰면 실제 표시 폭에 맞는 `sizes`를 함께 둔다. background를 CSS로 표시하면 media별 URL을 선택하고 두 variant를 동시에 eager img로 숨겨 두지 않는다. 예산 기준 모바일에서는 DPR만으로 무조건 primary15개를 내려받지 않는다.
4. 편집이 시작되고 첫 화면이 안정된 뒤 해당 주문의 thanks/repaired를 낮은 우선순위로 준비할 수 있다. 렌더링은 completed까지 보류한다. 해당 상태를 사전 다운로드하는 것과 화면에 정답/완료로 노출하는 것을 구분한다.
5. 다음 주문에 실제 진입할 때 그 주문 이미지를 요청한다. 주문 목록/진열의 viewport 밖 장식은 `loading=lazy`, `decoding=async`, 고정 width/height 또는 aspect-ratio로 layout shift를 막는다. 반복 손님·악기 경로는 동일 URL로 브라우저 cache를 공유한다.
6. 8완료 합주 화면 진입 때 필요한 repaired 악기/thanks 손님만 lazy/eager 구분해 표시한다. 이미지 로드 실패나 offline cache miss는 고정 크기의 단색 장식 대체로 처리하고 주문 제목·완료 텍스트·입력·오디오·저장은 DOM/로컬 코드로 계속 동작시킨다. 전체 세션 offline 핵심 기능을 그림 로드에 의존시키지 않는다.
7. 토큰·아이콘은 합계6,358B로 작다. 처음 필요한 상태만 요청하거나 앱이 참조하는 정적 SVG를 포함해도 예산 영향은 작지만, 20개의 불필요한 높은 우선순위 preload는 피한다. inline 시 검증한 원본 SVG만 사용하고 외부 입력을 innerHTML로 실행하지 않는다.
8. 확대 진열처럼 실제 그림 표시 크기가 커질 때 primary를 요청한다. 320px/확대에서는 고객/배경 장식을 축소·생략할 수 있으나 실제 텍스트와 행동은 유지한다. `<img>`가 이미 src를 가졌다면 CSS display:none만으로 다운로드 방지를 보장하지 않는다는 점을 네트워크에서 확인한다.

현재 파일명은 내용 hash가 포함되지 않은 안정 이름이다. `public/` 복사는 Vite가 자동 hash 이름으로 바꿔 주는 경로가 아니므로 무조건 장기 immutable cache를 주면 안 된다. S10/S14에서 실제 배포 cache 정책을 확인하고 재검증 가능한 캐시로 쓰거나 releaseId/hash 경로를 만들면 그에 맞춰 map·ledger·manifest URL을 함께 갱신한다. 원본 파일 자체와 SHA 기록은 보존한다.

## 6. 레이어·상태·접근성 연결

- 배경: 불투명, `object-fit:cover`, 패키지 권장 position `center 55%`. 전체 페이지 높이에 늘려 왜곡하지 않고, 본문은 불투명 종이 패널 위에 둔다. static preview의 `center 68%`는 예시 화면의 별도 선택이므로 앱의 최종 crop은 실제 viewport로 검수한다.
- 고객/악기: 투명 장식, contain, `alt=""`, `aria-hidden=true`, pointer-events:none. 의미 있는 이름과 완료 상태는 실제 DOM 텍스트로 제공한다. 그림의 빈 홈이나 투명 여백은 클릭 타깃이 아니다.
- 슬롯: 실제 button과 현재 음/역할/선택됨/고정됨 텍스트가 기능이다. 패키지 그림의 가운데 홈을 항상 3음이라고 정의하거나 바뀔 정답 슬롯에 빛/색을 주지 않는다.
- 역할 토큰: root 황토 원, third 테라코타 둥근 삼각형, fifth 세이지 팔각형. `default`, `selected`, `focus`, `locked`, `selected-focus` 각 상태가 있다. 선택과 포커스가 동시에 있으면 selected-focus를 쓰고 실제 :focus-visible/ARIA는 별도로 유지한다.
- locked art는 기능상 disabled 처리와 사유 설명을 대체하지 않는다. 접근할 수 있는 잠금 이유와 44px 버튼/48px NotePad를 유지한다. `:disabled`와 `aria-disabled`의 실제 키보드 행동은 현재 UI 계약에 맞춘다.
- 원래/수리 후 악기는 서비스 덮개, 손님은 중립/감사 표정 차이다. 정답/오답의 음악 음색·장단 감정 차이를 그림으로 만들지 않는다. 실패·무음·도움에 실망 표정 없음.
- 상태 전환은 즉시 정적 교체 또는180–240ms opacity. 전체<=300ms, reduced-motion에서 즉시 교체, skip 가능. 확대·흔들기·자동 효과음을 추가하지 않는다.
- icon은 inline SVG이면 currentColor, 외부 img면 기본 잉크색이다. 어두운 버튼에 외부 img를 올리면 대비를 직접 확인한다. 패키지 color recipe 대비10.04/6.89/5.57/4.17/5.10은 기존 QA의 값이며 앱의 실제 합성 대비·키보드·AT PASS가 아니다.

## 7. 출처 기록과 권리 확인 범위

패키지 문서는 생성 PNG15개를 이 요청용 OpenAI 이미지 생성물, SVG20개를 독립적으로 직접 작성한 벡터라고 기록한다. generation-prompts에는 15개의 프롬프트·날짜·source와 편집 reference가 있다. 편집 reference 일부는 과거 실행환경 `/workspace/scratch/...` 경로이며 현재 재접근 가능한 파일 경로가 아니다. 그에 대응하는 보존 PNG 및 source hash는 이번에 확인했다.

장부50개 모두 `reviewed=true`, `used_in_game=false`, `artifact_only=true`다. 이는 패키지 제작 시 기록이며 현재 앱 통합이나 배포 완료를 뜻하지 않는다. 30개의 WebP 파일은 원본15개의 mobile/primary 변환이다. 생성 모델 내부 버전은 패키지에서도 미확정이며 이를 임의로 특정 모델명으로 바꾸지 않는다.

장부의 scope는 요청 프로젝트의 통합·배포를 위한 전달물이고 적용 서비스 계약·법률을 따른다는 조건을 적고 있다. 원문은 독점성·저작권 성립·유사 권리 부재·법적 clearance를 보증하지 않으며 최종 권리·상표 검토를 별도로 남긴다. “외부 아트 재배포 의무 없음”은 패키지 작성자의 기록이다. 이번 감사는 제3자 계약이나 권리 데이터베이스를 확인하지 않았으므로 이를 독립적인 법률 결론으로 재작성하지 않는다.

사용자의 제공 에셋을 지정 게임에 통합·배포하라는 기존 승인은 존재한다. 이 감사가 새 외부 자산 사용권을 발급하거나 권한 확대를 승인하는 것은 아니다. 출처가 기록된 제공 패키지와 출처 미확인 임의 외부 자산을 혼동하지 않는다. 남은 확인은 이미 명시된 권리·상표/서비스 계약 적합성의 미검증 범위이며 근거 없이 독점성이나 완전한 권리 보장을 선언하지 않는다.

S10 통합 시 원본 장부는 그대로 보존하고 앱용 파생 장부를 작성한다. 실제 앱이 참조하는 항목만 `used_in_game=true`, 통합일·대상 URL·원본 hash·선택 variant를 기록한다. 파일을 수정/압축하면 기존 source hash를 보존하고 새 배포 hash를 추가한다. 아직 복사만 했거나 사용하지 않는 variant를 실제 사용했다고 표기하지 않는다.

앱에 provenance 문서를 함께 보관할 때 원본 `license_ref: docs/provenance-and-rights.md`가 어느 위치인지 명확히 매핑한다. 예를 들어 앱용 문서 `docs/assets/provenance-and-rights.md`와 배포 장부가 참조하는 `/licenses/chord-repair-shop-provenance.md`를 만들 경우 실제 존재 경로를 파생 장부에 기록하고, 원본 참조는 별도 origin 필드로 보존한다. 출처 문서를 옮겼는데 이전 상대 경로만 남기지 않는다. 원본 PNG/제작 도구/접촉 시트는 서비스 초기 payload로 복사하지 않는다.

오디오 `sfx-complete`, reference/pluck/reed/bell은 이미지 패키지 범위 밖의 런타임 합성이다. 실제 음원 파일·음원 권리 장부가 있는 것처럼 적지 않는다. 자산 QA는 오디오·게임·학습효과를 검증하지 않는다.

## 8. S10 이후 실제 해야 할 확인

1. runtime 선택 복사 후 원본 hash/배포 hash 대조, map32링크와 mobile 대응·8개 조합 확인. fallback/base path 및 유효 MIME 확인.
2. 실제 320/390/가로/200%/400% 화면에서 crop·잘림·버튼 덮임·footer·텍스트/기호·focus·reduced-motion 검수. placeholder와 DOM 동작은 이미지 실패에도 유지.
3. question 단계 전에 repaired/thanks가 보이지 않는지, 도움/무음 완료 아트가 동일한지, 새 연습은 original로 돌아오는지 테스트.
4. production 네트워크에서 첫 화면과 첫 작업대 전송량, primary/mobile 중복 다운로드, lazy 요청 시점, 불필요한 원본/접촉 시트 전송 없음 확인. 앱 전체1.5MB/자산5MB 예산은 실제 앱 기준으로 보고.
5. 장식 전후 domain/session/8주문/audio/storage/accessibility 회귀가 동일하게 통과하는지 확인. 합주59event와 음색은 아트 map에 의존하지 않음.
6. 앱용 장부와 release manifest, provenance 링크, 실제 사용 상태·미검증 권리 항목을 S13 인계에 포함.

현재 이 항목들은 통합 후 수행 대상이다. 패키지 원래 보고서는 게임 통합, 실제 iOS/Android, 오디오, screen reader, 전체 초기 전송, FPS/입력 지연, 교육효과, legal clearance, HTML Chromium rendering을 NOT RUN으로 적고 있다. 이 감사는 그 미실행을 PASS로 바꾸지 않았다.

## 부록 A. 원본 order-art-map.json

다음 블록은 패키지 파일에서 직접 삽입한 원문이다. runtime 경로는 위 배포 경로 매핑 규칙으로만 변환한다.

```json
{
  "schema_version": "1.0",
  "mapping_is_production_choice": true,
  "orders": [
    {
      "order_id": "CR01",
      "customer_id": "customer-01",
      "prop_id": "prop-musicbox-a",
      "before": {
        "customer": "runtime/customers/customer-01-neutral.webp",
        "prop": "runtime/props/prop-musicbox-a-original.webp"
      },
      "completion": {
        "customer": "runtime/customers/customer-01-thanks.webp",
        "prop": "runtime/props/prop-musicbox-a-repaired.webp"
      },
      "note": "Art pairing only. Do not derive target notes, chord roles, timbre or success from art."
    },
    {
      "order_id": "CR02",
      "customer_id": "customer-02",
      "prop_id": "prop-musicbox-a",
      "before": {
        "customer": "runtime/customers/customer-02-neutral.webp",
        "prop": "runtime/props/prop-musicbox-a-original.webp"
      },
      "completion": {
        "customer": "runtime/customers/customer-02-thanks.webp",
        "prop": "runtime/props/prop-musicbox-a-repaired.webp"
      },
      "note": "Art pairing only. Do not derive target notes, chord roles, timbre or success from art."
    },
    {
      "order_id": "CR03",
      "customer_id": "customer-03",
      "prop_id": "prop-pluckbox-b",
      "before": {
        "customer": "runtime/customers/customer-03-neutral.webp",
        "prop": "runtime/props/prop-pluckbox-b-original.webp"
      },
      "completion": {
        "customer": "runtime/customers/customer-03-thanks.webp",
        "prop": "runtime/props/prop-pluckbox-b-repaired.webp"
      },
      "note": "Art pairing only. Do not derive target notes, chord roles, timbre or success from art."
    },
    {
      "order_id": "CR04",
      "customer_id": "customer-04",
      "prop_id": "prop-reedbox-c",
      "before": {
        "customer": "runtime/customers/customer-04-neutral.webp",
        "prop": "runtime/props/prop-reedbox-c-original.webp"
      },
      "completion": {
        "customer": "runtime/customers/customer-04-thanks.webp",
        "prop": "runtime/props/prop-reedbox-c-repaired.webp"
      },
      "note": "Art pairing only. Do not derive target notes, chord roles, timbre or success from art."
    },
    {
      "order_id": "CR05",
      "customer_id": "customer-01",
      "prop_id": "prop-pluckbox-b",
      "before": {
        "customer": "runtime/customers/customer-01-neutral.webp",
        "prop": "runtime/props/prop-pluckbox-b-original.webp"
      },
      "completion": {
        "customer": "runtime/customers/customer-01-thanks.webp",
        "prop": "runtime/props/prop-pluckbox-b-repaired.webp"
      },
      "note": "Art pairing only. Do not derive target notes, chord roles, timbre or success from art."
    },
    {
      "order_id": "CR06",
      "customer_id": "customer-02",
      "prop_id": "prop-reedbox-c",
      "before": {
        "customer": "runtime/customers/customer-02-neutral.webp",
        "prop": "runtime/props/prop-reedbox-c-original.webp"
      },
      "completion": {
        "customer": "runtime/customers/customer-02-thanks.webp",
        "prop": "runtime/props/prop-reedbox-c-repaired.webp"
      },
      "note": "Art pairing only. Do not derive target notes, chord roles, timbre or success from art."
    },
    {
      "order_id": "CR07",
      "customer_id": "customer-03",
      "prop_id": "prop-musicbox-a",
      "before": {
        "customer": "runtime/customers/customer-03-neutral.webp",
        "prop": "runtime/props/prop-musicbox-a-original.webp"
      },
      "completion": {
        "customer": "runtime/customers/customer-03-thanks.webp",
        "prop": "runtime/props/prop-musicbox-a-repaired.webp"
      },
      "note": "Art pairing only. Do not derive target notes, chord roles, timbre or success from art."
    },
    {
      "order_id": "CR08",
      "customer_id": "customer-04",
      "prop_id": "prop-pluckbox-b",
      "before": {
        "customer": "runtime/customers/customer-04-neutral.webp",
        "prop": "runtime/props/prop-pluckbox-b-original.webp"
      },
      "completion": {
        "customer": "runtime/customers/customer-04-thanks.webp",
        "prop": "runtime/props/prop-pluckbox-b-repaired.webp"
      },
      "note": "Art pairing only. Do not derive target notes, chord roles, timbre or success from art."
    }
  ]
}
```

## 부록 B. 파일별 실제 크기·SHA-256

다음 표는 manifest에서 직접 추출했다. 모든 경로의 실제 SHA/bytes 일치는 이번 감사에서 재확인했다. 치수는 manifest 기록이다.

| runtime 상대 경로 | 치수 | B | SHA-256 |
|---|---|---:|---|
| backgrounds/bg-workbench-day-mobile.webp | 720×540 | 43088 | 39df39400b9c8900e152a2344c6468efd417854a085391c56f43478e98aa9d9f |
| backgrounds/bg-workbench-day.webp | 1440×1080 | 170478 | 4c3f4620c9a3c65994ef885688822d33804c3dabba138f1776ea285dbf90ecae |
| customers/customer-01-neutral-mobile.webp | 192×192 | 6590 | f3ed8397b82b964c7df11be9c91d5981cff9af8dfbdbbdcb1a03b460dcc022ac |
| customers/customer-01-neutral.webp | 384×384 | 18922 | 473168837dca9c0879fabcea890973a4a183a1f3b065358b77bfadbb899c86bc |
| customers/customer-01-thanks-mobile.webp | 192×192 | 6538 | fe0e9b6485d87d19328f4460816a9d248092d151d3a0732fe8a1554ae24d9098 |
| customers/customer-01-thanks.webp | 384×384 | 17996 | f789da04a698b61f7102fa03935125c5980167cc4c6cc95b5cbf86791ca15803 |
| customers/customer-02-neutral-mobile.webp | 192×192 | 6514 | c8ac12422900ca32fb41c314e5ef5f3578a15c369e4a50de24a340a34115b651 |
| customers/customer-02-neutral.webp | 384×384 | 18576 | 07cb3502ddded353e4d002854e7171c4786624e80af7d01ad3035df9f45f3c20 |
| customers/customer-02-thanks-mobile.webp | 192×192 | 6618 | f4fd6eeb0ff8d7116035e0d7183cbe94a1311b1615701d385e877164c53894f9 |
| customers/customer-02-thanks.webp | 384×384 | 18754 | aa0b3692a7d01ea8bbb5d4eba8a59ce498eacab7b8c392a3dcc6db5dc97e8dae |
| customers/customer-03-neutral-mobile.webp | 192×192 | 7810 | ab18b1bbd40ff24abde72664d83d60eb51ff8f2b31f1d239018eb95688064021 |
| customers/customer-03-neutral.webp | 384×384 | 23622 | b667d1fbffe84102741f055081bbdb42bbabec125dcb0f93f8b981b2dd4afa9a |
| customers/customer-03-thanks-mobile.webp | 192×192 | 6720 | 5b799f38d25e9800d1330f7cf1b5d71ab651508450ab9d37e63554d16d64039b |
| customers/customer-03-thanks.webp | 384×384 | 20000 | 0de7490a13404f4b470f6e5519c9671d56bdf3aea7dc65e70f1b8ab32da57d8f |
| customers/customer-04-neutral-mobile.webp | 192×192 | 6684 | a8fb2ec4bc13f86b0d1924db85e19fe7ad5330691444fd24190b4501bf02522a |
| customers/customer-04-neutral.webp | 384×384 | 19278 | 6628a801235c37685f0b5b6d5a725d504b760112f92b3153f026ec34f282f611 |
| customers/customer-04-thanks-mobile.webp | 192×192 | 6454 | f9c59432292b38fc27791e05edaff8f2e26639da4b96644aea12b5c6703f5971 |
| customers/customer-04-thanks.webp | 384×384 | 18254 | f449806f4d3133f0e7e558d89a941604516daeb277def7f1e031741b36198478 |
| icons/icon-hint.svg | 24×24 | 255 | d007850a7d8e4b73919dee5974873cda727c514578de92a5dca1de0f6fb65e8b |
| icons/icon-mute.svg | 24×24 | 256 | f25f88a40039c7f13b666e3e17f134a9ab9bbd3e6cda3751d7a080ee28e171f9 |
| icons/icon-play.svg | 24×24 | 263 | f4a99fbed02291c76d7106435d75a9bc01d47a6d64bc0239a1fbb3a4a2c7cf9e |
| icons/icon-stop.svg | 24×24 | 287 | beb888b7795030e5e0f1e5b8334aeb97ea4643ca0f4068aa241debb6f2fa5bee |
| icons/icon-undo.svg | 24×24 | 280 | ce2b3a893b65e336b31da0ad8d444722fc87dff8b73b5bb3ede1b050c922a389 |
| props/prop-musicbox-a-original-mobile.webp | 256×256 | 16960 | 2400c53b646a64409fe9957bab94c60dd3c3e9534c23f3a2b56206f5d4aca2d0 |
| props/prop-musicbox-a-original.webp | 512×512 | 51382 | 03ce5aa838b0af9b6f381306531faa867e47bb265abc11e142cad2f07a367156 |
| props/prop-musicbox-a-repaired-mobile.webp | 256×256 | 13876 | 32ef3b5acbdd2c4750c7d20601e88be5ecb3ab3831137c6f044162c93f14f068 |
| props/prop-musicbox-a-repaired.webp | 512×512 | 43418 | 02fcb40df55fdf2d36f9e9d7d77b23914404e8d489d08c1370cd8eab2cc6c779 |
| props/prop-pluckbox-b-original-mobile.webp | 256×256 | 12346 | 407bc05abf1735d487200be0ef78a97c1a4b4b60613a12c009c43e737a81b65a |
| props/prop-pluckbox-b-original.webp | 512×512 | 39226 | 3b60c17df49a6bf7b49983a0a4528596f0706e27aadf7ac9af382a945bb4a19a |
| props/prop-pluckbox-b-repaired-mobile.webp | 256×256 | 11972 | f136f8ab8f6ecc03b6eef943f9e4b1a324277faa275317b5ebcb83f76afd6dda |
| props/prop-pluckbox-b-repaired.webp | 512×512 | 37794 | 98d1bf9a7f51114829c86720e3f5bf06f4af7134262ebfd3f44890756601cc3d |
| props/prop-reedbox-c-original-mobile.webp | 256×256 | 10148 | a19fb7f3245739863e09e3447ad4a97ddef6662860b0903674692b3a8c1c8dba |
| props/prop-reedbox-c-original.webp | 512×512 | 29554 | 252547a6696deab9e5e77fef0941dc9a6a659fae53af4db5221337045b074e05 |
| props/prop-reedbox-c-repaired-mobile.webp | 256×256 | 10122 | 00322239aef530dabed69fb10963aa5af5e49d8d442e81555cfeb08c0e652b28 |
| props/prop-reedbox-c-repaired.webp | 512×512 | 29382 | b124f2e01f415fc0c183b4f036b4fbf1b6f8a76f9b7a0c8c851e71f6c6ff0d66 |
| tokens/token-fifth-focus.svg | 64×64 | 349 | 245a6508660e80d6457f181e2474d286abc6ec4e64cc883a06588db9166c0d61 |
| tokens/token-fifth-locked.svg | 64×64 | 427 | 5b620f1983607fe1ec2bd58296aaab4ed9ae6f926b3c83d848cf686d6e03f70f |
| tokens/token-fifth-selected-focus.svg | 64×64 | 395 | 54c0f68cc5c9ed68c8b54eef56a0f1647ed84f87d352f8f481c7e2ee20ec50a4 |
| tokens/token-fifth-selected.svg | 64×64 | 277 | 5551e7da3292f9f0c3520324baac8b1faa7f1a106e7c4cc5a2edd683e8b74888 |
| tokens/token-fifth.svg | 64×64 | 231 | 9d920442f3822c1401b21c5c5cf2d61e91449f88e204b8299e37fedd3e632e40 |
| tokens/token-root-focus.svg | 64×64 | 332 | 656c486360ffb49dd244467024c65c28832e2ebd1cf99e348cb8490860a8451a |
| tokens/token-root-locked.svg | 64×64 | 410 | 2f3f6a42c8e6a2edc79e2b7853c42e5b5c5ea5db1ecefc2036de4a8269706434 |
| tokens/token-root-selected-focus.svg | 64×64 | 378 | 283fef8eefed2ce30aa845e7c564e664145f3a2fb0ca7a6f04dd4c14f410a79e |
| tokens/token-root-selected.svg | 64×64 | 260 | cb61a1944150a2035cbf6c62b8c06fd6a455168c1a172967aec129c9822dbc09 |
| tokens/token-root.svg | 64×64 | 214 | 17e1d4d67ddf95081aad1bd515d268fd463b08d1c1cf28a080063c0bbd796bac |
| tokens/token-third-focus.svg | 64×64 | 362 | 3d3ca39c49095e9460928f9d3bea3591fbc2337fdb0418a3749fd20ef359befb |
| tokens/token-third-locked.svg | 64×64 | 440 | 600c680da5afd0ede0c37960a52298cf99ef686a8690101d97722e32f885cba8 |
| tokens/token-third-selected-focus.svg | 64×64 | 408 | 2bf48cb40cabf20aebf9cb07c62b91701a291d07408b424db50227174328d4b6 |
| tokens/token-third-selected.svg | 64×64 | 290 | 433776d0d521ee9779e8705e9c9ffc46300cb9440b77f1ccc30f4f0e49fa5f6a |
| tokens/token-third.svg | 64×64 | 244 | 4565964a103cb5796fb0f907231ffbf0a05280bc55bda87b9cb59f48eb3fc8b4 |

## 부록 C. 최초 모바일 작업대 참조 목록

이 목록은 패키지 initial_visual_files의 정확한 23개 경로이며 preload를 모두 강제하라는 지시가 아니다.

```text
runtime/backgrounds/bg-workbench-day-mobile.webp
runtime/customers/customer-01-neutral-mobile.webp
runtime/icons/icon-hint.svg
runtime/icons/icon-mute.svg
runtime/icons/icon-play.svg
runtime/icons/icon-stop.svg
runtime/icons/icon-undo.svg
runtime/props/prop-musicbox-a-original-mobile.webp
runtime/tokens/token-fifth-focus.svg
runtime/tokens/token-fifth-locked.svg
runtime/tokens/token-fifth-selected-focus.svg
runtime/tokens/token-fifth-selected.svg
runtime/tokens/token-fifth.svg
runtime/tokens/token-root-focus.svg
runtime/tokens/token-root-locked.svg
runtime/tokens/token-root-selected-focus.svg
runtime/tokens/token-root-selected.svg
runtime/tokens/token-root.svg
runtime/tokens/token-third-focus.svg
runtime/tokens/token-third-locked.svg
runtime/tokens/token-third-selected-focus.svg
runtime/tokens/token-third-selected.svg
runtime/tokens/token-third.svg
```
