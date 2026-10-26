export type FocusSession = {
  version: 1; phase: "focus" | "break"; running: boolean; startedAt: number | null;
  focusMs: number; breakMs: number; totalFocusMs: number; totalBreakMs: number;
  breakCount: number; breakMinutes: number; checkedSteps: number[]; proofNote: string; proofUrl: string;
};
export function newFocusSession(): FocusSession {
  return {version:1,phase:"focus",running:false,startedAt:null,focusMs:0,breakMs:0,totalFocusMs:0,totalBreakMs:0,breakCount:0,breakMinutes:5,checkedSteps:[],proofNote:"",proofUrl:""};
}
export function restoreFocusSession(value: unknown): FocusSession {
  const empty=newFocusSession();
  if (!value || typeof value!=="object") return empty;
  const v=value as Partial<FocusSession>;
  const number=(n:unknown)=>typeof n==="number"&&Number.isFinite(n)&&n>=0?n:0;
  return {...empty,phase:v.phase==="break"?"break":"focus",running:v.running===true&&number(v.startedAt)>0,startedAt:number(v.startedAt)||null,
    focusMs:number(v.focusMs),breakMs:number(v.breakMs),totalFocusMs:number(v.totalFocusMs),totalBreakMs:number(v.totalBreakMs),breakCount:Math.floor(number(v.breakCount)),
    breakMinutes:[5,10,15].includes(v.breakMinutes ?? 0)?v.breakMinutes!:5,
    checkedSteps:Array.isArray(v.checkedSteps)?[...new Set(v.checkedSteps.filter(n=>Number.isInteger(n)&&n>=0&&n<50))]:[],
    proofNote:typeof v.proofNote==="string"?v.proofNote.slice(0,2000):"",proofUrl:typeof v.proofUrl==="string"?v.proofUrl.slice(0,1000):""};
}
export function advanceFocusSession(session: FocusSession, now: number, focusMinutes: number): FocusSession {
  if (!session.running || session.startedAt===null) return session;
  const target=(session.phase==="focus"?focusMinutes:session.breakMinutes)*60000;
  const spent=session.phase==="focus"?session.focusMs:session.breakMs;
  const delta=Math.min(Math.max(0,now-session.startedAt),Math.max(0,target-spent));
  const finished=spent+delta>=target;
  return {...session,startedAt:finished?null:now,running:!finished,
    ...(session.phase==="focus"?{focusMs:spent+delta,totalFocusMs:session.totalFocusMs+delta}:{breakMs:spent+delta,totalBreakMs:session.totalBreakMs+delta})};
}
export function changeFocusSession(session: FocusSession, action: "start"|"pause"|"break"|"focus"|"reset", now: number, focusMinutes: number): FocusSession {
  const current=advanceFocusSession(session,now,focusMinutes);
  if(action==="pause")return {...current,running:false,startedAt:null};
  if(action==="break")return current.phase==="break"?current:{...current,phase:"break",breakMs:0,breakCount:current.breakCount+1,running:true,startedAt:now};
  if(action==="focus")return {...current,phase:"focus",running:false,startedAt:null};
  if(action==="reset")return {...current,phase:"focus",focusMs:0,running:false,startedAt:null};
  const remaining=(current.phase==="focus"?focusMinutes:current.breakMinutes)*60000-(current.phase==="focus"?current.focusMs:current.breakMs);
  return remaining<=0?current:{...current,running:true,startedAt:now};
}
export function proofReference(value: string): string | null {
  try {const url=new URL(value);return ["https:","http:"].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
