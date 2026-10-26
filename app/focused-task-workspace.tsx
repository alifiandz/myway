"use client";
import {useCallback,useEffect,useState} from "react";
import {Check,ChevronLeft,ChevronDown,CircleCheck,FileText,Sparkles,Target} from "lucide-react";
import {advanceFocusSession,changeFocusSession,restoreFocusSession,proofReference,type FocusSession} from "./focus-session";
type Routine={id:string;title:string;focus:string;minutes:number;focusSession?:FocusSession};
type Guide={source:string;sourceDetail:string;outcome:string;steps:string[];materials:string[];doneWhen:string[]};
export default function FocusedTaskWorkspace({routine,guide,isDone,close,toggleTask,onSave}:{routine:Routine;guide:Guide;isDone:boolean;close:()=>void;toggleTask:(id:string)=>void;onSave:(session:FocusSession)=>void}) {
  const [session,setSession]=useState(()=>restoreFocusSession(routine.focusSession));
  const [now,setNow]=useState(()=>Date.now());
  const commit=useCallback((next:FocusSession)=>{setSession(next);setNow(Date.now());onSave(next);},[onSave]);
  useEffect(()=>{
    if(!session.running)return;
    const timer=window.setInterval(()=>{const time=Date.now();setNow(time);const next=advanceFocusSession(session,time,routine.minutes);if(!next.running)commit(next);},500);
    return ()=>window.clearInterval(timer);
  },[session,routine.minutes,commit]);
  const current=advanceFocusSession(session,now,routine.minutes);
  const target=(current.phase==="focus"?routine.minutes:current.breakMinutes)*60000;
  const spent=current.phase==="focus"?current.focusMs:current.breakMs;
  const remaining=Math.max(0,Math.ceil((target-spent)/1000));
  const clock=`${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;
  const act=(action:Parameters<typeof changeFocusSession>[1])=>commit(changeFocusSession(session,action,Date.now(),routine.minutes));
  const update=useCallback((patch:Partial<FocusSession>)=>{const time=Date.now();commit({...advanceFocusSession(session,time,routine.minutes),...patch});},[session,routine.minutes,commit]);
  const reference=proofReference(session.proofUrl);
  const duration=(ms:number)=>`${Math.floor(ms/60000)}m ${Math.floor(ms/1000)%60}s`;
  return <div className="page-enter task-workspace">
    <button className="back-button" onClick={close}><ChevronLeft size={17}/> Back to weekly actions</button>
    <section className="task-workspace-head"><div><span className="eyebrow">Focused task</span><h2>{routine.title}</h2><p>{routine.focus}</p><span className="task-source"><Sparkles size={14}/> {guide.source}</span></div><button className={isDone?"outline-button selected":"primary-button"} onClick={()=>toggleTask(routine.id)}>{isDone?<><CircleCheck size={16}/> Completed</>:<><Check size={16}/> Mark complete</>}</button></section>
    <div className="task-workspace-grid"><main>
      <article className="card task-guide-card"><span className="section-label">Your outcome</span><h3>{guide.outcome}</h3><p>{guide.sourceDetail}</p></article>
      <article className="card task-guide-card"><div className="section-head"><div><span className="section-label">Do this now</span><h3>Session steps</h3></div><span className="today-count">{session.checkedSteps.filter(n=>n<guide.steps.length).length} of {guide.steps.length}</span></div><div className="task-step-list">{guide.steps.map((step,index)=>{const checked=session.checkedSteps.includes(index);return <button key={step} aria-pressed={checked} className={checked?"checked":""} onClick={()=>update({checkedSteps:checked?session.checkedSteps.filter(n=>n!==index):[...session.checkedSteps,index]})}><span>{checked?<Check size={15}/>:index+1}</span><strong>{step}</strong></button>;})}</div></article>
      <details className="card task-proof">
        <summary><FileText size={18}/><span><strong>{session.proofNote || session.proofUrl ? "Your proof" : "Add proof"}</strong><small>{session.proofNote || session.proofUrl ? "Saved note or reference" : "Note or reference · optional"}</small></span><ChevronDown size={16}/></summary>
        <div className="task-proof-fields"><label><span>Result or reflection</span><textarea rows={2} maxLength={2000} value={session.proofNote} placeholder="What did you finish?" onChange={event=>update({proofNote:event.target.value})}/></label><label><span>Reference link</span><input type="url" inputMode="url" maxLength={1000} value={session.proofUrl} placeholder="https://" onChange={event=>update({proofUrl:event.target.value})}/></label>{session.proofUrl&&!reference&&<p role="status">Use a full http or https link without login details.</p>}{reference&&<a className="text-link" href={reference} target="_blank" rel="noreferrer">Open reference</a>}<small>Personal record. Proof is optional and does not change task completion.</small></div>
      </details>
      <div className="task-info-grid"><article className="card task-guide-card"><span className="section-label">What you need</span><ul>{guide.materials.map(item=><li key={item}><CircleCheck size={15}/> {item}</li>)}</ul></article><article className="card task-guide-card"><span className="section-label">Done when</span><ul>{guide.doneWhen.map(item=><li key={item}><Target size={15}/> {item}</li>)}</ul></article></div>
    </main><aside className="card task-timer-card"><span className="section-label">{current.phase==="break"?"Break timer":"Focus timer"}</span><div className={`task-timer-ring ${current.phase}`} style={{background:`radial-gradient(circle at center, #fff 64%, transparent 65%), conic-gradient(${current.phase==="break"?"var(--green)":"var(--blue)"} ${Math.min(100,spent/target*100)}%, #e9ebf3 0)`}} role="timer" aria-label={`${current.phase} time remaining ${clock}`}><strong>{clock}</strong><small>{current.phase==="break"?`${current.breakMinutes} minute break`:`${routine.minutes} minute session`}</small></div>
      <p className="focus-phase-status" role="status">{remaining===0?(current.phase==="break"?"Break finished. Return when you are ready.":"Focus session finished."):current.running?(current.phase==="break"?"Taking a break":"Focus in progress"):"Timer paused"}</p>
      {remaining>0&&<button className="primary-button" onClick={()=>act(current.running?"pause":"start")}>{current.running?"Pause timer":"Start timer"}</button>}
      {current.phase==="focus"?<div className="focus-break-controls"><label><span>Break length</span><select value={session.breakMinutes} onChange={event=>update({breakMinutes:Number(event.target.value)})}>{[5,10,15].map(n=><option key={n} value={n}>{n} minutes</option>)}</select></label><button className="outline-button" onClick={()=>act("break")}>Take a break</button></div>:<button className="outline-button focus-return" onClick={()=>act("focus")}>Return to focus</button>}
      <button className="text-link" onClick={()=>act("reset")}>Reset focus timer</button>
      <dl className="focus-session-summary"><div><dt>Focus time</dt><dd>{duration(current.totalFocusMs)}</dd></div><div><dt>Break time</dt><dd>{duration(current.totalBreakMs)}</dd></div><div><dt>Breaks started</dt><dd>{current.breakCount}</dd></div></dl>
      <details className="focus-session-help"><summary>How time is recorded</summary><p className="focus-timer-note">Time is counted while the timer runs, including when you leave this page. Timers stop at their set duration.</p><p className="focus-timer-note">Reset keeps your recorded time, proof and steps.</p><p className="focus-timer-note">Timers and proof do not automatically complete a task or add a habit check in.</p></details>
      <details className="task-related"><summary>Connected to</summary><strong>{guide.source}</strong><p>{guide.sourceDetail}</p></details>
    </aside></div>
  </div>;
}
