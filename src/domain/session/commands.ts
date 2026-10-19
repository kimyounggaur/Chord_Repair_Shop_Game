import type { Order } from '../../content/types';
import { gradeMidi } from '../grading';
import type { GradeCommand, SessionEvent } from './types';

export function executeGradeCommand(command:GradeCommand,order:Order):Extract<SessionEvent,{type:'GRADE_READY'}> {
  if(command.request.orderId!==order.id) throw new Error('Grade command order mismatch');
  return {type:'GRADE_READY',request:{...command.request},grade:gradeMidi(command.notes,order)};
}
