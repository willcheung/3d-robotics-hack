import {lessonIds,lessonTargets,type LessonId} from './model.ts';
import {getLesson} from './lessons.ts';
import {missionAccess} from './progression.ts';
export const challengeLabels:Record<string,string>={beacon:'North ridge',farther:'East lookout',reverse:'Lower cove','sensor-left':'Recover from 30°','sensor-right':'Recover from 90°','sensor-transfer':'Lower cove transfer','patrol-ridge':'Ridge sweep','patrol-extra':'Extra checkpoint','patrol-cove':'Cove return','parcel-across':'Across the guard','parcel-moved':'Moved receiving tray','parcel-return':'Return delivery'};
export const concepts:Record<LessonId,string>={L01:'Motor power, time and position',L02:'Sensor readings and decisions',L03:'Loops and repeated movement',L04:'Sequencing an arm and gripper'};
export function progressRows(completed:readonly string[]){return lessonIds.map(id=>({id,title:getLesson(id).title,concept:concepts[id],count:lessonTargets[id].filter(t=>completed.includes(t)).length,...missionAccess(id,completed),challenges:lessonTargets[id].map(target=>({target,label:challengeLabels[target],complete:completed.includes(target)}))}));}
