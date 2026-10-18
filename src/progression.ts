import {lessonIds,lessonTargets,type LessonId} from './model.ts';

/** Only pass the current profile's server-checked targets, never practice logs. */
export function missionAccess(lesson:LessonId,completed:readonly string[]) {
  const done=(id:LessonId)=>lessonTargets[id].every(target=>completed.includes(target));
  const required=lessonIds.slice(0,lessonIds.indexOf(lesson)).find(id=>!done(id));
  return {required,complete:!required&&done(lesson),message:required
    ? `Finish all 3 challenges in Mission ${Number(required.slice(1))} to unlock. Successful runs save progress automatically when signed in.`
    : ''};
}
