import {indonesiaProgrammes, readIndonesiaPlans} from './indonesia-data';
import {programmeResearch, universityResearch, evidenceText} from './indonesia-research';
export const isIndonesiaProgramme = (id?: string) => Boolean(id?.startsWith('id-'));
export function mergeIndonesiaSelections(main:{id:string;role:'Dream'|'Target'|'Alternative'}[], legacy?:string){
 const result=[...main];for(const plan of readIndonesiaPlans(legacy))if(!result.some(p=>p.id===plan.id))result.push(plan);
 let dream=false;return result.map(p=>p.role==='Dream'?(dream?{...p,role:'Target' as const}:(dream=true,p)):p);
}
export const indonesiaPlanningProgrammes=indonesiaProgrammes.map(p=>{
 const r=programmeResearch[p.id], a=universityResearch[p.university_id].admissions.fields;
 const text=(f:typeof a[string]|undefined)=>f?`${evidenceText(f.value,false)||'Not confirmed'}${f.sourceYear?' · '+f.sourceYear:''}`:'Not confirmed';
 return {id:p.id,universityId:`indonesia-${p.university_id}`,university:p.university,initials:p.university_id.toUpperCase(),logo:'',title:p.title,location:'Indonesia',duration:text(r.fields.duration),language:text(r.fields.language),entry:'2027 requirements not confirmed. '+text(a.eligibility),management:'Not assessed',enterprise:'Not assessed',marketing:'Not assessed',math:'Not assessed',experience:'Not assessed',tuition:text(a.fees),verified:'Official evidence by source year; confirm current intake',why:[],caution:['Historical guidance is not confirmed 2027 policy.'],curriculum:[],sources:[{label:'Official programme information',href:p.faculty_source_url||p.official_source_url}]};
});
