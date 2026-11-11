'use client';

import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, ArrowRight, Bookmark, Check, ChevronRight, GraduationCap, Search, Scale, X} from 'lucide-react';
import {majors,steps,ratingLabels,STORAGE_KEY,emptyState,readState,toggleChoice,type DiscoveryState,type Major} from './model';
import './discovery.css';

type Mode = 'explorer' | 'match';
type Update = (fn:(state:DiscoveryState)=>DiscoveryState)=>void;

function useDiscovery() {
  const [state,setState]=useState(emptyState);
  const [ready,setReady]=useState(false);
  const [storageError,setStorageError]=useState('');
  useEffect(()=>{
    try {setState(readState(localStorage.getItem(STORAGE_KEY)));}
    catch {setStorageError('Device storage is unavailable. Keep this page open to retain your changes.');}
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready) return;
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
    catch {setStorageError('Your latest changes could not be saved on this device.');}
  },[state,ready]);
  function update(fn:(s:DiscoveryState)=>DiscoveryState) {
    setState(s=>({...fn(s),updatedAt:new Date().toISOString()}));
  }
  return {state,update,ready,storageError};
}

function MajorCard({major,saved,compared,save,compare,open}:{major:Major;saved:boolean;compared:boolean;save:()=>void;compare:()=>void;open:()=>void}) {
  return <article className="card md-major-card">
    <div className="md-card-heading"><span className="md-category">{major.category}</span><button className={`md-save ${saved?'selected':''}`} aria-label={`${saved?'Unsave':'Save'} ${major.name}`} aria-pressed={saved} onClick={save}><Bookmark size={18} fill={saved?'currentColor':'none'}/></button></div>
    <button className="md-card-title" onClick={open}><h3>{major.name}</h3></button>
    <span className="md-label">Subjects to explore</span><ul className="md-subjects">{major.subjects.map(subject=><li key={subject}>{subject}</li>)}</ul>
    <div className="md-card-actions"><button className={`outline-button ${compared?'selected':''}`} aria-label={`Compare ${major.name}`} aria-pressed={compared} onClick={compare}><Scale size={14}/>{compared?'Selected':'Compare'}</button><button className="text-link" onClick={open}>View major <ChevronRight size={15}/></button></div>
  </article>;
}

function Profile({major,saved,save,onExplore}:{major:Major;saved:boolean;save:()=>void;onExplore:(name?:string)=>void}) {
  return <div className="md-profile">
    <span className="md-category">{major.category}</span><h2>{major.name}</h2>
    <p>Use these starting points to find out whether you would enjoy studying this subject.</p>
    <div className="md-profile-grid"><section><h3>What you could study</h3><ul className="md-profile-subjects">{major.subjects.map(subject=><li key={subject}><Check size={16}/>{subject}</li>)}</ul></section><section><h3>What to look for in a programme</h3><ul><li>Required first-year modules</li><li>Practical work and independent study</li><li>Entry subjects and professional qualifications</li></ul></section></div>
    <section className="md-next-step"><GraduationCap size={24}/><div><h3>Find a university programme</h3><p>Continue in MyWay’s university catalogue. Check each programme’s official title, modules and requirements.</p><button className="primary-button" onClick={()=>onExplore(major.name)}>Browse universities <ArrowRight size={15}/></button><small>Programme links for this major are still being reviewed.</small></div></section>
    <details className="md-review"><summary>Draft content & sources</summary><p>Subject prompts come from the Major Discovery planning draft (10 November 2026), version {major.version}. Curriculum sources, Indonesian names and programme equivalences await editorial review. These prompts are not a verified curriculum or admissions checklist. No assessment profile has been assigned.</p></details>
    <button className="outline-button" aria-pressed={saved} onClick={save}><Bookmark size={16} fill={saved?'currentColor':'none'}/>{saved?'Saved to your majors':'Save major'}</button>
  </div>;
}

function ReflectionIntro({start,ready}:{start:()=>void;ready:boolean}) {
  return <section className="md-match-intro">
    <div className="page-intro"><div><span className="eyebrow">Major Match</span><h2>What would you enjoy studying?</h2><p>Reflect on your interests before you start comparing majors and university programmes.</p></div></div>
    <div className="card md-start-card"><span className="md-intro-icon"><GraduationCap size={28}/></span><h3>Start with what interests you</h3><p>Think about what you enjoy learning, not just what you are already good at. You can change your answers or skip a question.</p><ol className="md-intro-steps"><li><span>1</span><div><strong>Explore your curiosity</strong><small>Subjects, fields and university activities</small></div></li><li><span>2</span><div><strong>Think about your priorities</strong><small>Your strengths, motivations and preferences</small></div></li><li><span>3</span><div><strong>Build a research list</strong><small>Review your answers and save majors to explore</small></div></li></ol>
      <button className="primary-button" disabled={!ready} onClick={start}>Start reflection <ArrowRight size={16}/></button><span className="md-start-meta">8 steps · No account needed · Progress saved on this device</span>
      <div className="md-assessment-note"><strong>Unscored preview</strong><p>You can try the reflection questions and review your answers. Major recommendations are not available yet.</p><details><summary>About this preview</summary><p>These are original MyWay questions, not a validated assessment. The official O*NET interest chapter is on hold while permissions and implementation are reviewed. No interest scores, match percentages or ability measures are calculated.</p></details></div>
    </div>
  </section>;
}

function Reflection({state,update}:{state:DiscoveryState;update:Update}) {
  const current=steps[state.step];
  const heading=useRef<HTMLHeadingElement>(null);
  const selected=state.answers[String(state.step)]||[];
  useEffect(()=>{heading.current?.focus({preventScroll:true});},[state.step]);
  function move(step:number) {update(s=>({...s,step}));window.scrollTo({top:0,behavior:'instant'});}
  function next() {if(state.step===7) update(s=>({...s,finished:true}));else move(state.step+1);}
  return <section className="md-quiz">
    <div className="md-step-meta"><span>{state.step<5?'Your curiosity':'Your priorities'}</span><span>Step {state.step+1} of 8</span></div><progress aria-label="Reflection progress" value={state.step+1} max={8}/>
    <div className="card md-question-card"><span className="md-category">{current.title}</span><h2 ref={heading} tabIndex={-1}>{current.question}</h2><p className="md-question-help">{current.instruction}</p>
    {current.options?<><div className="md-selection-count" role="status">{selected.length ? `${selected.length} selected` : 'Nothing selected'} · Up to {current.max}</div><fieldset className="md-choices"><legend className="md-sr-only">{current.question}</legend>{current.options.map(option=><label key={option} className={selected.includes(option)?'selected':''}><input type="checkbox" checked={selected.includes(option)} disabled={!selected.includes(option)&&selected.filter(x=>x!==current.exclusive).length>=current.max&&option!==current.exclusive} onChange={()=>update(s=>({...s,answers:{...s.answers,[String(s.step)]:toggleChoice(s.answers[String(s.step)]||[],option,current.max,current.exclusive)}}))}/><span>{option}</span></label>)}</fieldset></>:<div className="md-ratings">{current.ratings?.map((activity,j)=><fieldset key={activity}><legend>{activity}</legend><div>{ratingLabels.map(label=><label key={label} className={state.answers[`${state.step}.${j}`]?.[0]===label?'selected':''}><input type="radio" name={`activity-${state.step}-${j}`} checked={state.answers[`${state.step}.${j}`]?.[0]===label} onChange={()=>update(s=>({...s,answers:{...s.answers,[`${s.step}.${j}`]:[label]}}))}/><span>{label}</span></label>)}</div><button className="text-link" onClick={()=>update(s=>({...s,answers:{...s.answers,[`${s.step}.${j}`]:[]}}))}>Clear answer</button></fieldset>)}</div>}
    <div className="md-quiz-actions"><button className="outline-button" disabled={state.step===0} onClick={()=>move(state.step-1)}><ArrowLeft size={15}/>Back</button><button className="text-link" onClick={()=>{update(s=>{const answers={...s.answers};delete answers[String(s.step)];current.ratings?.forEach((_,j)=>delete answers[`${s.step}.${j}`]);return {...s,answers,step:s.step<7?s.step+1:s.step,finished:s.step===7};});}}>Skip this step</button><button className="primary-button" onClick={next}>{state.step===7?'Review answers':'Continue'}<ArrowRight size={15}/></button></div></div>
    <p className="md-quiet-note">Saved on this device. “Unsure” records uncertainty; skipping leaves a question unanswered. This preview does not calculate matches.</p>
  </section>;
}

function ReflectionSummary({state,update,onModeChange,onExplore,onSearch,open}:{state:DiscoveryState;update:Update;onModeChange:(mode:Mode)=>void;onExplore:()=>void;onSearch:(query:string)=>void;open:(major:Major)=>void}) {
  const liked=steps.flatMap((step,i)=>step.ratings?.filter((_,j)=>['Like','Strongly Like'].includes(state.answers[`${i}.${j}`]?.[0]))||[]);
  const saved=majors.filter(major=>state.saved.includes(major.id));
  const subjectSearches:Record<string,string>={'Economics & Business':'Economics','Psychology & Sociology':'Psychology','History & Politics':'History','Law & Civics':'Law','Languages & Literature':'Literature','Visual Arts & Design':'Design','Geography & Environment':'Environment'};
  const researchQuestions:Record<string,string>={'Extensive mathematics':'How much mathematics and statistics are compulsory?','Frequent coding':'How much programming is required, and what introductory support is available?','Laboratory work':'How many laboratory modules and practical hours are required?','Direct patient-facing work':'Are clinical placements or direct patient contact required?','Extensive academic reading or writing':'What reading, essay and research-project workload should I expect?','Frequent public speaking':'How often are presentations and group discussions assessed?','Intensive studio or design critique':'How much studio time and design critique is part of the course?','Long professional training':'What further training or registration is needed after the degree?'};
  const questions=(state.answers['7']||[]).flatMap(choice=>researchQuestions[choice]?[researchQuestions[choice]]:[]);
  const searchSubjects=(state.answers['0']||[]).filter(subject=>subject!=='Other'&&subject!=="I'm not sure yet");
  return <section className="md-summary"><div className="page-intro"><div><span className="eyebrow">Your reflection</span><h2>Turn your interests into questions to explore</h2><p>Use what you shared to compare subjects and build your own list of majors.</p></div><button className="outline-button" onClick={()=>update(s=>({...s,finished:false,step:0}))}>Edit answers</button></div>
    <div className="md-summary-grid"><section className="card md-summary-card"><h3>Your interests</h3><dl><dt>Subjects you chose</dt><dd>{state.answers['0']?.join(' · ')||'Not answered yet'}</dd><dt>Fields you want to understand</dt><dd>{state.answers['1']?.join(' · ')||'Not answered yet'}</dd></dl>{liked.length>0&&<><h4>Activities you said you would enjoy</h4><ul>{liked.map(activity=><li key={activity}>{activity}</li>)}</ul></>}<section className="md-subject-searches"><h4>Explore the subjects you chose</h4><p>Open a keyword search in Major Explorer. These are starting points you selected.</p><div>{searchSubjects.map(subject=><button key={subject} className="outline-button" onClick={()=>onSearch(subjectSearches[subject]||subject)}><Search size={13}/>{subjectSearches[subject]||subject}</button>)}{searchSubjects.length===0&&<button className="text-link" onClick={()=>onModeChange('explorer')}>Browse all fields<ArrowRight size={14}/></button>}</div></section><details><summary>Review all answers</summary>{steps.map((step,i)=><section className="md-answer-block" key={step.title}><h4>{step.title}</h4>{step.ratings?step.ratings.map((activity,j)=><p key={activity}>{activity}<strong>{state.answers[`${i}.${j}`]?.[0]||'Not answered'}</strong></p>):<p>{state.answers[String(i)]?.join(' · ')||'Not answered'}</p>}<button className="text-link" onClick={()=>update(s=>({...s,finished:false,step:i}))}>Edit this step</button></section>)}</details></section>
    <section className="card md-summary-card"><h3>Your saved majors <span className="md-count">{saved.length}</span></h3><p>These are majors you saved, not assessment recommendations.</p>{saved.length?<ul className="md-saved-list">{saved.map(major=><li key={major.id}><button onClick={()=>open(major)}>{major.name}<ChevronRight size={16}/></button></li>)}</ul>:<div className="md-saved-empty"><Bookmark size={24}/><strong>Start your research list</strong><p>Browse the majors and save any you would like to learn more about.</p></div>}<button className="primary-button" onClick={()=>onModeChange('explorer')}>Explore majors <ArrowRight size={15}/></button></section></div>
    {questions.length>0&&<section className="card md-research-questions"><h3>Questions to ask about a programme</h3><p>Based on the study commitments you said you would prefer to avoid. Use these to investigate the workload and support available.</p><ul>{questions.map(question=><li key={question}>{question}</li>)}</ul></section>}
    <section className="card md-next-research"><div><h3>Next: look at real university programmes</h3><p>Compare course modules, entry requirements and study commitments with what you enjoy.</p></div><button className="outline-button" onClick={onExplore}>Browse universities <ArrowRight size={15}/></button></section><p className="md-quiet-note">Unscored preview. Your answers have not been used to rank majors or measure ability. Official assessment and matching remain under review.</p>
  </section>;
}

export default function Discovery({mode,onModeChange,onExplore}:{mode:Mode;onModeChange:(mode:Mode)=>void;onExplore:(name?:string)=>void}) {
  const {state,update,ready,storageError}=useDiscovery();
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('All fields');
  const [savedOnly,setSavedOnly]=useState(false);
  const [page,setPage]=useState(1);
  const [detail,setDetail]=useState<Major|null>(null);
  const [showCompare,setShowCompare]=useState(false);
  const [notice,setNotice]=useState('');
  const [clearConfirm,setClearConfirm]=useState(false);
  const dialogRef=useRef<HTMLDialogElement>(null);
  const opener=useRef<HTMLElement|null>(null);
  const resultsHeading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{
    if(detail||showCompare) {opener.current=document.activeElement as HTMLElement;dialogRef.current?.showModal();}
    else if(dialogRef.current?.open) {dialogRef.current.close();opener.current?.focus();}
  },[detail,showCompare]);
  function closeDialog() {setDetail(null);setShowCompare(false);}
  function save(id:string) {update(s=>({...s,saved:toggleChoice(s.saved,id,60)}));}
  function compare(id:string) {
    if(!state.compare.includes(id)&&state.compare.length===3) {setNotice('You can compare three majors at a time. Remove one to add another.');return;}
    setNotice('');update(s=>({...s,compare:toggleChoice(s.compare,id,3)}));
  }
  const visible=majors.filter(major=>(category==='All fields'||major.category===category)&&(!savedOnly||state.saved.includes(major.id))&&`${major.name} ${major.category} ${major.subjects.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  const totalPages=Math.max(1,Math.ceil(visible.length/12));
  const activePage=Math.min(page,totalPages);
  const comparison=majors.filter(major=>state.compare.includes(major.id));
  return <div className="md-discovery">
    {mode==='explorer'?<>
      <section className="page-intro"><div><span className="eyebrow">Major Explorer</span><h2>Find subjects you want to explore</h2><p>Compare what you could study and save majors to research further.</p></div><button className="outline-button" onClick={()=>onModeChange('match')}>{state.started?'Continue reflection':'Try Major Match'}<ArrowRight size={15}/></button></section>
      <section className="card md-search-card"><div className="md-search-row"><label className="search-box"><Search size={18}/><input aria-label="Search majors and subjects" value={query} placeholder="Search majors or subjects…" onChange={e=>{setQuery(e.target.value);setPage(1);}}/>{query&&<button aria-label="Clear major search" onClick={()=>{setQuery('');setPage(1);}}><X size={16}/></button>}</label><label className="md-field-filter"><span className="md-sr-only">Academic field</span><select aria-label="Academic field" value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}>{['All fields',...new Set(majors.map(major=>major.category))].map(field=><option key={field}>{field}</option>)}</select></label></div><div className="md-browse-options"><div role="group" aria-label="Major list"><button className={!savedOnly?'active':''} aria-pressed={!savedOnly} onClick={()=>{setSavedOnly(false);setPage(1);}}>All majors <span>60</span></button><button className={savedOnly?'active':''} aria-pressed={savedOnly} onClick={()=>{setSavedOnly(true);setPage(1);}}><Bookmark size={14}/>Saved <span>{state.saved.length}</span></button></div><span>12 fields · Draft subject guides</span></div></section>
      <div className="md-results-heading"><h3 ref={resultsHeading} tabIndex={-1}>{savedOnly?'Saved majors':category==='All fields'?'All majors':category} <span>{visible.length}</span></h3><span>{visible.length?`${(activePage-1)*12+1}–${Math.min(activePage*12,visible.length)} of ${visible.length}`:'No results'}</span></div>
      {visible.length?<div className="md-major-grid">{visible.slice((activePage-1)*12,activePage*12).map(major=><MajorCard key={major.id} major={major} saved={state.saved.includes(major.id)} compared={state.compare.includes(major.id)} save={()=>save(major.id)} compare={()=>compare(major.id)} open={()=>setDetail(major)}/>)}</div>:<div className="card md-empty"><Search size={26}/><h3>{savedOnly&&!query?'No saved majors yet':'No majors found'}</h3><p>{savedOnly?'Save a major to keep it in your research list.':'Try a different subject or clear your filters.'}</p><button className="outline-button" onClick={()=>{setQuery('');setCategory('All fields');setSavedOnly(false);setPage(1);}}>View all majors</button></div>}
      {totalPages>1&&<nav className="md-pagination" aria-label="Major result pages"><button className="outline-button" disabled={activePage===1} onClick={()=>{setPage(activePage-1);resultsHeading.current?.scrollIntoView({block:'start'});resultsHeading.current?.focus();}}><ArrowLeft size={14}/>Previous</button><span>Page {activePage} of {totalPages}</span><button className="outline-button" disabled={activePage===totalPages} onClick={()=>{setPage(activePage+1);resultsHeading.current?.scrollIntoView({block:'start'});resultsHeading.current?.focus();}}>Next<ArrowRight size={14}/></button></nav>}
    </>:!state.started?<ReflectionIntro ready={ready} start={()=>update(s=>({...s,started:true}))}/>:state.finished?<ReflectionSummary state={state} update={update} onModeChange={onModeChange} onExplore={()=>onExplore()} onSearch={value=>{setQuery(value);setCategory('All fields');setSavedOnly(false);setPage(1);onModeChange('explorer');}} open={setDetail}/>:<Reflection state={state} update={update}/>}
    {mode==='explorer'&&state.compare.length>0&&<aside className="card md-compare-tray" aria-label="Selected majors"><div><strong>Compare majors</strong><span>{comparison.map(major=><button key={major.id} aria-label={`Remove ${major.name} from comparison`} onClick={()=>compare(major.id)}>{major.name}<X size={13}/></button>)}</span></div><button className="primary-button" disabled={comparison.length<2} onClick={()=>setShowCompare(true)}>Compare {comparison.length} of 3<Scale size={15}/></button></aside>}
    <footer className="md-data-footer"><p>Saved majors and reflection answers stay on this device.</p><details><summary>Preview details & data controls</summary><p>All major profiles are drafts awaiting curriculum and source review. University programme mappings and assessment scoring are not enabled. Your reflection answers are not sent to analytics or synced to an account.</p>{clearConfirm?<div className="md-clear-confirm"><p>Delete your saved majors, comparisons and reflection answers from this preview?</p><button className="outline-button" onClick={()=>{update(()=>emptyState());setClearConfirm(false);setNotice('Your preview data has been cleared.');}}>Delete preview data</button><button className="text-link" onClick={()=>setClearConfirm(false)}>Cancel</button></div>:<button className="text-link" onClick={()=>setClearConfirm(true)}>Clear preview data</button>}</details></footer>
    <p className="md-status" role="status">{storageError||notice||(!ready?'Loading saved progress…':'')}</p>
    <dialog ref={dialogRef} className="md-dialog" onCancel={e=>{e.preventDefault();closeDialog();}} aria-label={detail?`${detail.name} profile`:'Compare majors'}><button className="md-dialog-close icon-button" aria-label="Close major details" onClick={closeDialog}><X size={18}/></button>{detail?<Profile major={detail} saved={state.saved.includes(detail.id)} save={()=>save(detail.id)} onExplore={name=>{closeDialog();onExplore(name);}}/>:<><span className="eyebrow">Major Explorer</span><h2>Compare majors</h2><p>Look at the subjects side by side. These draft guides do not measure your fit.</p><div className="md-table-scroll"><table><caption className="md-sr-only">Selected major comparison</caption><thead><tr><th scope="col">Compare</th>{comparison.map(major=><th scope="col" key={major.id}>{major.name}<button className="text-link" onClick={()=>compare(major.id)}>Remove</button></th>)}</tr></thead><tbody><tr><th scope="row">Field</th>{comparison.map(major=><td key={major.id}>{major.category}</td>)}</tr><tr><th scope="row">Subjects to explore</th>{comparison.map(major=><td key={major.id}><ul>{major.subjects.map(subject=><li key={subject}>{subject}</li>)}</ul></td>)}</tr><tr><th scope="row">Your research list</th>{comparison.map(major=><td key={major.id}><button className="outline-button" aria-pressed={state.saved.includes(major.id)} onClick={()=>save(major.id)}>{state.saved.includes(major.id)?'Saved':'Save major'}</button></td>)}</tr><tr><th scope="row">Next step</th>{comparison.map(major=><td key={major.id}><button className="text-link" onClick={()=>{setShowCompare(false);setDetail(major);}}>View major<ChevronRight size={14}/></button></td>)}</tr></tbody></table></div><p className="md-quiet-note">Curriculum details and university programme links are still being reviewed.</p></>}</dialog>
  </div>;
}
