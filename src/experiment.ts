import {lessonTargets, type LessonId} from './model.ts';

export type Experiment = {source:string; target:string; prediction:string; reflection:string; previous?:{source:string;target:string}};
export const validTarget = (lesson:LessonId, target:unknown): target is string => typeof target==='string' && (lessonTargets[lesson] as readonly string[]).includes(target);
/** Local notes are paired with the exact draft. Older source-only saves remain valid. */
export function readExperiment(raw:string|null, source:string, lesson:LessonId, target?:string):Experiment {
  const fresh:Experiment={source,target:validTarget(lesson,target)?target:lessonTargets[lesson][0],prediction:'',reflection:''};
  try {
    const saved=JSON.parse(raw??'null');
    if(!saved || saved.source!==source || !validTarget(lesson,saved.target))return fresh;
    return {...fresh,target:saved.target,
      prediction:typeof saved.prediction==='string'?saved.prediction.slice(0,600):'',
      reflection:typeof saved.reflection==='string'?saved.reflection.slice(0,600):'',
      ...(typeof saved.previous?.source==='string' && validTarget(lesson,saved.previous.target)?{previous:{source:saved.previous.source,target:saved.previous.target}}:{})};
  }catch{return fresh;}
}
