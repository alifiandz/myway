import data from './indonesia-structured-curricula.json';

/** A published source can be verified while its structured extraction remains partial. */
export type StructuredCurriculumCourse = {
  name?: string | null;
  code?: string | null;
  semester?: number | string | null;
  sks?: number | string | null;
  classification?: string | null;
  sourceUrl?: string;
  sourcePage?: number;
  [key: string]: unknown;
};
export type StructuredCurriculum = {
  programmeId: string;
  sourceUrl: string;
  curriculumYear: string | null;
  sourceVerification: 'verified';
  completeness: 'complete' | 'partial';
  currentCohortApplicability: 'not_established';
  applicabilityNote: string;
  sourceDocumentSha256: string;
  courses: StructuredCurriculumCourse[];
  [key: string]: unknown;
};
export const structuredCurricula = data as unknown as Record<string, StructuredCurriculum>;
