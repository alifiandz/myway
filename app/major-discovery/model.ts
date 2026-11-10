import catalogue from './majors.json';
export const majors = catalogue;
export type Major = (typeof majors)[number];
export const STORAGE_KEY = 'myway-major-discovery-preview-v1';
export const VERSION = 'preview-1';
export const unsure = "I'm not sure yet";
export const ratingLabels = ['Strongly Dislike', 'Dislike', 'Unsure', 'Like', 'Strongly Like'];
export const steps = [
 {title:'Subjects that interest you',question:'If you could spend more time learning three school subjects, which would you choose?',instruction:'Choose up to three. Think about what you enjoy learning, not just the grades you receive.',max:3,exclusive:unsure,options:['Mathematics','Physics','Biology','Chemistry','Computer Science','Economics & Business','Psychology & Sociology','History & Politics','Law & Civics','Languages & Literature','Visual Arts & Design','Geography & Environment','Religious Studies','Other',unsure]},
 {title:'Fields that spark your curiosity',question:'Which of these topics would you love to understand better?',instruction:"Choose up to four. You don't need to know which major they belong to.",max:4,exclusive:unsure,options:['Health & Medicine','Human Behavior','Technology & Artificial Intelligence','Engineering & Machines','Environment & Nature','Law & Justice','Global Affairs','Business & Economics','Arts, Design & Media','Education & Learning','Scientific Discovery','History, Languages & Culture',unsure]},
 {title:'People, society and ideas',question:'Imagine you had the opportunity to try each activity at university. How much would you enjoy it?',instruction:'Rate each activity independently. Unsure is a response; an unanswered item is left blank.',ratings:['Study how people learn, remember information, and make decisions.','Examine a legal dispute and compare arguments using evidence.','Research an international issue using historical and political sources.','Plan a lesson that helps students understand a difficult concept.']},
 {title:'Science, technology and discovery',question:'Imagine you had the opportunity to try each activity at university. How much would you enjoy it?',instruction:'Rate each activity independently.',ratings:['Write, test, and improve a computer program.','Use mathematics to design or improve a technical solution.','Investigate how living organisms function through scientific experiments.','Analyze scientific measurements to explain an unexpected result.']},
 {title:'Design, business and the world around us',question:'Imagine you had the opportunity to try each activity at university. How much would you enjoy it?',instruction:'Rate each activity independently.',ratings:['Create a visual design and improve it using feedback.','Analyze financial or market information to make a business decision.','Collect environmental observations and investigate changes in an ecosystem.','Study historical or literary sources and develop an evidence-based interpretation.']},
 {title:'Your perceived strengths',question:'Which abilities do you think are currently among your strengths?',instruction:"Choose up to three. It's completely fine if you're still figuring this out. These are reflections, not measured aptitude.",max:3,exclusive:"I'm still discovering my strengths",options:['Explaining ideas','Analyzing information','Creative thinking','Organizing details','Building or fixing things','Understanding other people','Leading discussions','Writing',"I'm still discovering my strengths"]},
 {title:'What matters to you',question:"I'd feel most fulfilled if what I studied helped me...",instruction:'Choose up to two. These are your priorities, not a personality diagnosis.',max:2,exclusive:unsure,options:['Discover how things work','Help people directly','Solve practical problems','Create something original','Improve communities or society','Build businesses or organizations','Understand different cultures and perspectives','Teach others and share knowledge',unsure]},
 {title:'Something to consider',question:"Are there any activities or study commitments you'd strongly prefer to avoid?",instruction:"These won't automatically remove majors. They'll help you understand what to consider.",max:8,exclusive:'No strong preferences',options:['Extensive mathematics','Frequent coding','Laboratory work','Direct patient-facing work','Extensive academic reading or writing','Frequent public speaking','Intensive studio or design critique','Long professional training','No strong preferences']}
];
export type DiscoveryState = {version:string; saved:string[]; compare:string[]; answers:Record<string,string[]>; step:number; started:boolean; finished:boolean; updatedAt:string; instrumentVersion:null; modelVersion:null; mappingVersion:string};
export function emptyState():DiscoveryState { return {version:VERSION,saved:[],compare:[],answers:{},step:0,started:false,finished:false,updatedAt:'',instrumentVersion:null,modelVersion:null,mappingVersion:'editorial-draft-1'}; }
export function toggleChoice(selected:string[], value:string, max:number, exclusive?:string) {
 if(selected.includes(value)) return selected.filter(x=>x!==value);
 if(value===exclusive) return [value];
 const next=selected.filter(x=>x!==exclusive);
 return next.length<max ? [...next,value] : next;
}
export function readState(raw:string|null):DiscoveryState {
 const base=emptyState(); if(!raw || raw.length>50000) return base;
 try {const v=JSON.parse(raw); if(!v || v.version!==VERSION) return base;
 const ids=new Set(majors.map(x=>x.id)); const validIds=(x:unknown,limit:number)=>Array.isArray(x)?[...new Set(x.filter((s):s is string=>typeof s==='string' && ids.has(s)))].slice(0,limit):[];
 const answers:Record<string,string[]>={};
 steps.forEach((s,i)=>{const key=String(i); if(s.options && Array.isArray(v.answers?.[key])) {let a=v.answers[key].filter((x:unknown)=>typeof x==='string' && s.options.includes(x));a=[...new Set(a)];answers[key]=a.includes(s.exclusive)?[s.exclusive]:a.slice(0,s.max);}
 s.ratings?.forEach((_,j)=>{const k=`${i}.${j}`;const a=v.answers?.[k];if(Array.isArray(a)&&a.length===1&&ratingLabels.includes(a[0]))answers[k]=a;}); });
 return {...base,saved:validIds(v.saved,60),compare:validIds(v.compare,3),answers,step:Number.isInteger(v.step)?Math.max(0,Math.min(7,v.step)):0,started:v.started===true,finished:v.finished===true,updatedAt:typeof v.updatedAt==='string'?v.updatedAt.slice(0,40):''};
 }catch{return base;}
}
