# 독립 평가 문항 은행

실제 문항·채점·정답·A/B 배정·노출 통제는 [transfer-plan.md](transfer-plan.md)에 있다. 이 경로는 S12의 표준 산출물 이름으로 제공한다. `transfer/items.json`은 그 문서의 여섯 음고 예시를 검산하는 연구용 fixture이며 앱 번들·CR01–08·해금·학습 저장에는 연결하지 않는다.

`node docs/research/transfer/verify.mjs`로 별도 literal MIDI·간격·음고류와 앱과의 분리를 확인할 수 있다. 이는 문항 정답의 기술 검산이며 참가자 성취·문항 동등 난이도·검사 타당도를 검증하지 않는다. 실제 관찰·채점·청각 출력 확인은 NOT RUN이다.
