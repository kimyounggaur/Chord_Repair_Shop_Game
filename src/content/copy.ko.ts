import type {Order} from './types';
export type HintCopy={text:string;revealsReflectionAnswer:boolean};
const relations:Record<string,HintCopy>={
  CR01:{text:'장3화음은 근음에서 3음까지 4반음, 5음까지 7반음이에요.',revealsReflectionAnswer:false},
  CR02:{text:'단3화음의 3음은 근음보다 3반음 위에 있어요.',revealsReflectionAnswer:true},
  CR03:{text:'근음이 달라져도 장3화음의 거리 규칙은 같아요. 5음은 근음보다 7반음 위에 있어요.',revealsReflectionAnswer:false},
  CR04:{text:'G를 근음으로 삼아 3음까지의 거리를 살펴보세요.',revealsReflectionAnswer:false},
  CR05:{text:'장3화음은 근음에서 3음까지 4반음, 5음까지 7반음이에요.',revealsReflectionAnswer:false},
  CR06:{text:'단3화음은 근음에서 3음까지 3반음, 5음까지 7반음이에요.',revealsReflectionAnswer:true},
  CR07:{text:'근음은 관계의 기준이에요. 3음은 화음의 종류를, 5음은 근음에서 7반음인 관계를 살펴봐요.',revealsReflectionAnswer:true},
  CR08:{text:'이번 주문의 근음은 F예요. 현재 세 음을 주문의 관계와 비교해 보세요.',revealsReflectionAnswer:false},
};
export function hintCopy(order:Order,level:1|2):HintCopy{
  return level===1?relations[order.id]:{text:`목표는 ${order.target.join(' · ')}예요. 근음에서 3음까지 ${order.targetMidi[1]-order.targetMidi[0]}반음, 5음까지 7반음이에요. 원래 음과 비교해 보세요.`,revealsReflectionAnswer:true};
}
export const tutorialSteps=[
  '소리를 켜거나 소리 없이 시작할 수 있어요. 기기 음량을 낮게 시작해 주세요.',
  '의뢰서의 주문은 C 장3화음이에요. 시간 제한은 없어요.',
  '오르골에는 세 음이 들어 있어요. 원래 화음을 듣거나 음이름을 읽어 보세요.',
  '근음은 기준, 3음과 5음은 그 기준에서의 관계를 나타내요.',
  '첫 주문은 가운데 3음을 바꿔요. C와 G는 그대로 두어요.',
  '음 조각을 고르고 원하는 음을 자유롭게 눌러 보세요. 정답 키는 표시하지 않아요.',
  '준비되면 수리 확인을 눌러요. 다시 바꾸거나 되돌릴 수 있어요.',
  '수리 뒤 관계 질문을 생각해 보세요. 응답하거나 건너뛴 뒤 변화를 비교할 수 있어요.',
] as const;
