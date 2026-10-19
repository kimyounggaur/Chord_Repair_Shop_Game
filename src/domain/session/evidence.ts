import type { AttemptEvidence } from './types';

export function freshEvidence():AttemptEvidence {
  return {evidenceStatus:'known',firstSubmission:null,finalSuccess:false,maxRepairHintLevel:0,maxReflectionHintLevel:0,answerRevealedBeforeFirstAnswer:false,firstReflectionAnswer:null,latestReflectionAnswer:null,reflectionSkipped:false};
}

export function exposeReflectionAnswer(evidence:AttemptEvidence):AttemptEvidence {
  if (evidence.firstReflectionAnswer!==null || evidence.reflectionSkipped || evidence.answerRevealedBeforeFirstAnswer) return evidence;
  return {...evidence,answerRevealedBeforeFirstAnswer:true};
}

/** Storage adapters can reject an older same-attempt checkpoint with this predicate. */
export function evidenceDoesNotRegress(previous:AttemptEvidence,next:AttemptEvidence):boolean {
  return !(previous.evidenceStatus==='unknown' && next.evidenceStatus==='known')
    && next.maxRepairHintLevel>=previous.maxRepairHintLevel
    && next.maxReflectionHintLevel>=previous.maxReflectionHintLevel
    && (!previous.finalSuccess || next.finalSuccess)
    && (!previous.answerRevealedBeforeFirstAnswer || next.answerRevealedBeforeFirstAnswer)
    && (!previous.reflectionSkipped || next.reflectionSkipped)
    && (previous.firstSubmission===null || JSON.stringify(next.firstSubmission)===JSON.stringify(previous.firstSubmission))
    && (previous.firstReflectionAnswer===null || JSON.stringify(next.firstReflectionAnswer)===JSON.stringify(previous.firstReflectionAnswer));
}
