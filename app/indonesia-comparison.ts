export const INDONESIA_COMPARISON_KEY = "indonesia-university-comparison";
export function readUniversityComparison(value: string | undefined, validIds: readonly string[]): string[] {
  try {const parsed:unknown=JSON.parse(value||"[]");if(!Array.isArray(parsed))return [];return [...new Set(parsed.filter((id):id is string=>typeof id==="string"&&validIds.includes(id)))].slice(0,4);}catch{return [];}
}
export function toggleUniversityComparison(current: readonly string[], id: string, validIds: readonly string[]) {
  const selection=readUniversityComparison(JSON.stringify(current),validIds);
  if(selection.includes(id))return {selection:selection.filter(value=>value!==id),limitReached:false};
  if(!validIds.includes(id))return {selection,limitReached:false};
  if(selection.length>=4)return {selection,limitReached:true};
  return {selection:[...selection,id],limitReached:false};
}
export function facultyHighlights(faculties: readonly string[]) {
  const preferred=faculties.filter(f=>/ekonomi|bisnis|teknik/i.test(f));
  return [...new Set([...preferred,...faculties])].slice(0,2).map(f=>f.replace(/^Fakultas\s+/i,"")).join(" · ");
}
