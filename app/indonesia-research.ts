import {structuredCurricula, type StructuredCurriculum} from './indonesia-structured-curricula';
import researchData from './indonesia-deep-research.json';
export type ResearchStatus='verified'|'not_announced'|'source_inaccessible'|'not_found'|'conflicting';
export type EvidenceField={value:unknown;status:ResearchStatus;sourceUrl?:string|null;sourceYear?:string|null;note?:string|{en:string;id:string}|null};
export type ProgrammeResearchRecord={structuredCurriculum?:StructuredCurriculum;status:string;checkedOn?:string;fields:Record<string,EvidenceField>;courses?:{name:string;sourceUrl:string}[];searchLog:{url:string;outcome:string}[]};
export type UniversityResearchRecord={universityId:string;checkedOn:string;programmes:Record<string,ProgrammeResearchRecord>;admissions:{targetYear:string;fields:Record<string,EvidenceField>}};
export const universityResearch=researchData as Record<string,UniversityResearchRecord>;
export const programmeResearch=Object.assign({},...Object.values(universityResearch).map(u=>u.programmes)) as Record<string,ProgrammeResearchRecord>;
// Optional extension leaves legacy course examples and source evidence unchanged.
for (const [programmeId, curriculum] of Object.entries(structuredCurricula)) {
 if (programmeResearch[programmeId]) programmeResearch[programmeId].structuredCurriculum = curriculum;
}
export function evidenceText(value:unknown,id:boolean):string {
 if(value===null||value===undefined)return '';
 if(typeof value==='object'&&!Array.isArray(value)&&('en' in value||'id' in value)){const v=value as {en?:unknown;id?:unknown};return evidenceText(id?(v.id??v.en):(v.en??v.id),id);}
 if(Array.isArray(value))return value.map(v=>evidenceText(v,id)).filter(Boolean).join(' · ');
 return typeof value==='object'?Object.entries(value).map(([key,v])=>`${key}: ${evidenceText(v,id)}`).join(' · '):String(value);
}
export function isConfirmedTargetYear(field:EvidenceField){const tentative=/prelim|sementara|perkiraan|indicative|tentative|rencana awal/i.test(`${field.sourceYear??''} ${evidenceText(field.value,false)} ${evidenceText(field.note,false)}`);return field.status==='verified'&&!tentative&&/^2027(?:\s*[\/–-]\s*(?:2028|28))?$/.test(field.sourceYear??'');}
export function researchCoverage(){const entries=Object.values(programmeResearch);return {auditedProgrammes:entries.length,withCurriculumSources:entries.filter(r=>r.fields.curriculum?.status==='verified').length,withVerifiedFacts:entries.filter(r=>Object.values(r.fields).some(f=>f.status==='verified')).length,conflicts:entries.filter(r=>Object.values(r.fields).some(f=>f.status==='conflicting')).length};}
