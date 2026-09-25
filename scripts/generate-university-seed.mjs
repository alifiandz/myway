import fs from "node:fs";
import ts from "typescript";
import { ftDirectoryIdentities } from "../app/ft-directory-data.ts";
import { additionalSchoolStudyRows, schoolStudyRows } from "../app/school-data.ts";

const pageSource = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const sourceFile = ts.createSourceFile("page.tsx", pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function readLiteral(name) {
  let initializer;
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) initializer = declaration.initializer;
    }
  });
  if (!initializer) throw new Error(`Could not find ${name} in app/page.tsx`);
  const expression = initializer.getText(sourceFile);
  const transpiled = ts.transpileModule(`const value = ${expression}; value;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  return Function(`"use strict"; ${transpiled.replace(/value;\s*$/, "return value;")}`)();
}

const businessSchoolRows = readLiteral("businessSchoolRows");
const businessSchoolDomains = readLiteral("businessSchoolDomains");
const identityCorrections = readLiteral("identityCorrections");
const additionalBusinessSchoolRows = readLiteral("additionalBusinessSchoolRows");

let universities = businessSchoolRows.map(([rank, name, location], index) => {
  const id = `ft-school-${index + 1}`;
  const identity = ftDirectoryIdentities[id] ?? {};
  return {
    id,
    name,
    city: identity.city,
    country: identity.country,
    region: "Europe",
    websiteDomain: businessSchoolDomains[index],
    institutionType: "business_school",
    parentUniversity: null,
    directorySource: "FT",
    directoryOrder: index + 1,
    logoUrl: `/institution-logos/${id}.png`,
    identitySourceUrl: identity.source,
    identityVerifiedOn: "2026-09-18",
    ...Object.fromEntries(Object.entries(identityCorrections[id] ?? {}).map(([key, value]) => [{
      domain: "websiteDomain",
      institutionType: "institutionType",
      parentUniversity: "parentUniversity",
      identitySource: "identitySourceUrl",
      identityVerifiedOn: "identityVerifiedOn",
      logoUrl: "logoUrl",
      city: "city",
      country: "country",
      region: "region",
      name: "name",
    }[key] ?? key, value])),
  };
});

universities = universities.filter((university) => {
  const sourceIndex = Number(university.id.slice("ft-school-".length)) - 1;
  return schoolStudyRows[sourceIndex]?.status === "bachelor";
});

for (const [id, name, location, domain] of additionalBusinessSchoolRows) {
  const study = additionalSchoolStudyRows[id];
  universities.push({
    id,
    name,
    city: location.split(",")[0],
    country: location.split(",").slice(1).join(",").trim(),
    region: id === "verified-school-nus" ? "Asia" : "Europe",
    websiteDomain: domain,
    institutionType: "university",
    parentUniversity: null,
    directorySource: "Official",
    directoryOrder: universities.length + 1,
    logoUrl: `/institution-logos/${id}.png`,
    identitySourceUrl: study.source,
    identityVerifiedOn: study.lastVerified ?? "2026-09-17",
  });
}

universities = universities.map((university) => ({
  ...university,
  institutionType: university.institutionType === "business-school" ? "business_school" : university.institutionType,
}));

const studies = Object.fromEntries(universities.map((university, index) => [
  university.id,
  university.id.startsWith("ft-school-")
    ? schoolStudyRows[Number(university.id.slice("ft-school-".length)) - 1]
    : additionalSchoolStudyRows[university.id],
]));

if (universities.length !== 100) throw new Error(`Expected 100 universities, found ${universities.length}`);
if (universities.some((university) => !studies[university.id])) throw new Error("A university is missing study data");

const quote = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `${quote(JSON.stringify(value))}::jsonb`;

const universityValues = universities.map((u) => `(${[
  u.id, u.name, u.city, u.country, u.region, u.websiteDomain, u.institutionType,
  u.parentUniversity, u.directorySource, u.directoryOrder, u.logoUrl,
  u.identitySourceUrl, u.identityVerifiedOn, "published",
].map(quote).join(", ")})`).join(",\n");

const programmeValues = universities.map((u) => {
  const study = studies[u.id];
  return `(${[
    `${u.id}-primary`, u.id, study.title, study.status, study.duration, study.credits,
    study.language, JSON.stringify(study.areas), study.source, study.sourceLabel,
    study.lastVerified ?? null, study.note ?? null, "partially_verified", "published",
  ].map(quote).join(", ")})`;
}).join(",\n");

const detailedKeys = ["tuition", "application_deadline", "entry_requirement", "ranking"];
const factRows = [];
for (const university of universities) {
  const study = studies[university.id];
  const programmeId = `${university.id}-primary`;
  for (const [key, value] of [["duration", study.duration], ["credits", study.credits], ["teaching_language", study.language]]) {
    factRows.push(`(${quote(programmeId)}, ${quote(key)}, ${value == null ? "null" : json(value)}, ${quote(study.lastVerified ? "verified" : "under_review")}, ${quote(study.source)}, ${quote(study.lastVerified ?? null)}, ${quote(value == null ? "Not yet verified" : null)})`);
  }
  for (const key of detailedKeys) {
    factRows.push(`(${quote(programmeId)}, ${quote(key)}, null, 'not_yet_verified', ${quote(study.source)}, null, 'Not yet verified')`);
  }
}

const sql = `begin;

insert into public.universities
  (id, name, city, country, region, website_domain, institution_type, parent_university, directory_source, directory_order, logo_url, identity_source_url, identity_verified_on, publication_status)
values
${universityValues}
on conflict (id) do update set
  name = excluded.name, city = excluded.city, country = excluded.country,
  region = excluded.region, website_domain = excluded.website_domain,
  institution_type = excluded.institution_type, parent_university = excluded.parent_university,
  directory_source = excluded.directory_source, directory_order = excluded.directory_order,
  logo_url = excluded.logo_url, identity_source_url = excluded.identity_source_url,
  identity_verified_on = excluded.identity_verified_on, publication_status = excluded.publication_status,
  updated_at = now();

insert into public.programmes
  (id, university_id, title, study_level, duration, credits, teaching_language, subject_areas, official_source_url, source_label, source_checked_on, note, verification_status, publication_status)
values
${programmeValues}
on conflict (id) do update set
  university_id = excluded.university_id, title = excluded.title, study_level = excluded.study_level,
  duration = excluded.duration, credits = excluded.credits, teaching_language = excluded.teaching_language,
  subject_areas = excluded.subject_areas::jsonb, official_source_url = excluded.official_source_url,
  source_label = excluded.source_label, source_checked_on = excluded.source_checked_on,
  note = excluded.note, verification_status = excluded.verification_status,
  publication_status = excluded.publication_status, updated_at = now();

insert into public.programme_facts
  (programme_id, field_key, value, status, source_url, verified_on, note)
values
${factRows.join(",\n")}
on conflict (programme_id, field_key, academic_year, applicant_context) do update set
  value = excluded.value, status = excluded.status, source_url = excluded.source_url,
  verified_on = excluded.verified_on, note = excluded.note, updated_at = now();

commit;
`;

fs.writeFileSync(new URL("../supabase/seed-university-catalog.sql", import.meta.url), sql);
console.log(JSON.stringify({ universities: universities.length, programmes: universities.length, facts: factRows.length }));
