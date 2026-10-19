import type {Order} from '../content/types';
import type {SessionCommand,SessionState} from '../domain/session/types';
import type {EnsembleOptions} from '../audio/ensemble-events';
import type {EnsembleView} from '../audio/ensemble';

/** The UI passes immutable user-note snapshots, never a hidden answer, to audio. */
export type AudioSnapshot=Readonly<{orderId:string;attemptId:string;revision:number;original:readonly number[];current:readonly number[]}>;
export type WorkbenchServices={
  enable:()=>Promise<boolean>;
  previewNote:(midi:number)=>void;
  playOriginal:(snapshot:AudioSnapshot)=>void;
  playCurrent:(snapshot:AudioSnapshot)=>void;
  compare:(snapshot:AudioSnapshot)=>void;
  arpeggiate:(snapshot:AudioSnapshot)=>void;
  stopAll:()=>void;
  status:()=>string;
  ensemble?:{play:(options:EnsembleOptions)=>void;subscribe:(listener:()=>void)=>()=>void;getSnapshot:()=>EnsembleView};
  onCommand?:(command:SessionCommand,state:SessionState,order:Order)=>void;
};
const noop=()=>undefined;
export const silentServices:WorkbenchServices={enable:async()=>false,previewNote:noop,playOriginal:noop,playCurrent:noop,compare:noop,arpeggiate:noop,stopAll:noop,status:()=> 'unavailable'};

