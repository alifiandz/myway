import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const read=p=>fs.readFileSync(p,'utf8');
function exportsFrom(path){const exports={};vm.runInNewContext(ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}
const {ftDirectoryIdentities}=exportsFrom('app/ft-directory-data.ts');
const {schoolStudyRows,additionalSchoolStudyRows}=exportsFrom('app/school-data.ts');
const source=read('app/page.tsx'), ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const wanted=['businessSchoolRows','identityCorrections','additionalBusinessSchoolRows'];
const declarations=[];
for(const statement of ast.statements)if(ts.isVariableStatement(statement))for(const declaration of statement.declarationList.declarations)if(wanted.includes(declaration.name.getText(ast)))declarations.push('const '+declaration.getText(ast)+';');
const context={};vm.createContext(context);vm.runInContext(ts.transpileModule(declarations.join('\n')+'\nglobalThis.result={businessSchoolRows,identityCorrections,additionalBusinessSchoolRows};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
const {businessSchoolRows,identityCorrections,additionalBusinessSchoolRows}=context.result;
const rows=businessSchoolRows.flatMap(([rank,name,location],i)=>{if(schoolStudyRows[i].status!=='bachelor')return [];const id=`ft-school-${i+1}`,identity=ftDirectoryIdentities[id];return [{id,name,location,city:identity.city,country:identity.country,status:'bachelor',...identityCorrections[id]}];});
for(const [id,name,location] of additionalBusinessSchoolRows){if(additionalSchoolStudyRows[id].status==='bachelor')rows.push({id,name,location,city:location.split(',')[0],country:location.split(',').slice(1).join(',').trim(),status:'bachelor'});}
const catalogue=JSON.parse(read('app/indonesia-catalogue.json')),locations=JSON.parse(read('app/indonesia-university-locations.json')),logos=JSON.parse(read('app/institution-logo-assets.json'));
for(const [uid,name] of new Map(catalogue.map(p=>[p.university_id,p.university]))){if(!locations[uid]?.city)throw Error('Missing Indonesian location: '+uid);rows.push({id:'indonesia-'+uid,name,city:locations[uid].city,country:'Indonesia',status:'bachelor'});}
const records=rows.map(row=>{if(!row.city||!row.country)throw Error('Missing location: '+row.id);const logo=logos[row.id]?.src??`/institution-logos/${row.id}.png`;if(!fs.existsSync('public'+logo))throw Error('Missing logo: '+logo);return {id:row.id,name:row.name,city:row.city,country:row.country,status:row.status,logoSrc:logo};});
if(new Set(records.map(r=>r.id)).size!==records.length)throw Error('Duplicate institution');
const countries=new Set(records.map(r=>r.country)), cities=new Set(records.map(r=>r.country+'|'+r.city.trim().toLowerCase()));
const totals=[countries.size,cities.size,records.length];
const file='public/welcome/index.html';let html=read(file);
html=html.replace(/const catalogRecords=.*?;\n/,()=>`const catalogRecords=${JSON.stringify(records)};\n`);
html=html.replace(/<path\b[^>]*><title>([^<]+)<\/title><\/path>/g,(path,title)=>{if(!countries.has(title)||path.includes('data-country="'))return path;return path.replace(/class="[^"]*"/,'class="land available"').replace(/ aria-hidden="true"/,'').replace(/<path\b/,'<path data-country="'+title+'" tabindex="0" role="button"');});
// Canonical SVG names may differ from directory country names.
for(const country of countries){if(!html.includes('data-country="'+country+'"'))throw Error('Country not interactive: '+country);}
html=html.replace(/<div class="coverage-stats"[\s\S]*?<\/div><p class="coverage-scope">[\s\S]*?<\/p>/,()=>`<div class="coverage-stats" aria-label="${totals[0]}+ countries, ${totals[1]}+ cities, ${totals[2]}+ universities and schools, including Indonesia">${['Countries','Cities','Universities &amp; schools'].map((label,i)=>`<div class="coverage-stat"><span class="stat-number" data-total="${totals[i]}" aria-hidden="true">${totals[i]}+</span><span class="stat-label">${label}</span></div>`).join('')}</div><p class="coverage-scope">Indonesia and international destinations · Based on listed undergraduate institutions and their main locations.</p>`);
html=html.replaceAll("img.src='assets/institution-logos/'+school.id+'.png'","img.src=school.logoSrc").replaceAll("image.src='assets/institution-logos/'+school.id+'.png'","image.src=school.logoSrc");
html=html.replace("if(reduceMotion){el.textContent=total;return}el.textContent='0';","if(reduceMotion){el.textContent=total+'+';return}el.textContent='0+';");
html=html.replace('el.textContent=Math.round(total*(1-Math.pow(1-progress,2)))','el.textContent=Math.round(total*(1-Math.pow(1-progress,2)))+\'+\'');
fs.writeFileSync(file,html);
console.log(JSON.stringify({countries:totals[0],cities:totals[1],institutions:totals[2],indonesia:records.filter(r=>r.country==='Indonesia').length}));
