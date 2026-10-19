import type { Quality, SpelledPitch, Triad } from '../domain/music';

export type Order = Readonly<{
  schemaVersion:1;
  contentVersion:string;
  id:string;
  title:string;
  root:SpelledPitch;
  quality:Quality;
  initial:Triad;
  target:Triad;
  initialMidi:readonly [number,number,number];
  targetMidi:readonly [number,number,number];
  editableSlots:readonly number[];
  allowedMidi:readonly [number,number];
  displaySpellingMap:Readonly<Record<number,SpelledPitch>>;
  registerMode:'exact';
  spellingRequired:false;
  inversion:0;
  primaryConcept:'major-third'|'minor-third'|'fifth'|'root';
  hintPolicy:'guided'|'optional';
  reflection:Readonly<{prompt:string;options:readonly string[];answerIndex:number}>;
}>;
