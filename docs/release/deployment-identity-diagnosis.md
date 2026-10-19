# S14 배포 식별 수정

첫 구현 커밋3e01e47은 Vercel READY였으나 운영 releaseId/sourceSha가 로컬과 달라 smoke가 즉시 실패했다. 이 실패를 `evidence/S14-source-identity-before.json`에 보존했다. 콘텐츠·lockfile·자산 manifest·전체58개 정적 산출물 manifest의 해시는 일치했으나 이것만으로 전체 배포 검증을 PASS하지 않았다.

ea49ab7에서 소스54개 path/hash를 release manifest에 추가해 비교했다. 차이는 vercel.json 하나뿐이었다. 운영에서 관찰한 hash `2105f59aa18aeea60ffa2e29de15170402fac87831488d062af813f556b3acd9`는 로컬 설정을 JSON.parse 후 JSON.stringify(들여쓰기 없음)+LF로 직렬화한 값과 정확히 같았다. 설정 내용은 그대로이고 배포 과정의 직렬화만 달랐다.

저장소의 vercel.json을 그 동일한 형식으로 저장했다. 원본 design/promptpack/아트는 손대지 않았다. sourceFiles는 진단 가능성을 위해 유지하고, 실제 raw 파일 hash 비교를 생략하거나 완화하지 않는다. 설정 의미와 앱 런타임은 바뀌지 않았으며 다시 실행한 reference/content25/type/build와 정적 artifact manifest 동일성을 확인한다. 전체 기능 회귀198+144/20분 결과는 바이트가 같은 앱에 적용한다. 수정 후 운영 검증은 S14 인계에 별도로 남긴다.
