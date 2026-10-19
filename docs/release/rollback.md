# 정적 배포 되돌리기 절차

이번 프로젝트의 최초 배포 전에 이전 정상 운영 deployment는 없었다. S14에서 검증한 be4dc0f의 READY deployment `dpl_9kpALQEfrjRNzBfwkXL6P3LzRB8k`와 실제 manifest는 이후 동일 앱 후보의 기준점으로 남긴다. 운영 rollback은 실제 수행·검증하지 않았다. 로컬 원본 백업과 Git 이력은 그대로 보존했다.

다음 정상 버전부터는 검증된 commit/releaseId와 immutable deployment ID, 실제 release.json/해시 manifest를 기록한다. 문제가 있는 새 배포는 원인·노출 상태를 먼저 확인한 뒤 기존 승인 범위 안에서 정상 deployment를 production alias로 되돌린다. 삭제나 force push로 이력을 없애지 않는다. 기존이 없는 첫 배포 실패라면 정상 버전을 지어내지 말고 실패 상태를 알린다.

1. 현재 배포와 되돌릴 후보의 READY·Git SHA·실제 bytes를 확인한다.
2. 사용자가 내보내기를 보관할 수 있도록 안내하고 schemaVersion/contentVersion 호환을 검사한다.
3. 호환 가능한 정적 build로 alias를 되돌린다. IndexedDB를 자동 삭제하거나 낮은 버전으로 덮어쓰지 않는다.
4. HTTPS/자산/CR01 무음·제스처 소리·저장 복원·새로고침 route·CSP를 다시 검사한다.
5. 작업 시각·대상·현재 URL·제한을 남긴다. 실제 수행 전에는 절차 준비로만 표시한다.

앱 schema1/content1.0.0은 알 수 없는 미래 버전을 거절하고 원본을 보존한다. 미래 schema를 도입할 때 구 build의 읽기/복구와 export roundtrip을 별도로 검증해야 한다. 호환성이 확인되지 않으면 저장 삭제를 지름길로 사용하지 않는다.
