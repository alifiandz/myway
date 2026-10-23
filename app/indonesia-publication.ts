import catalogue from './indonesia-catalogue.json';
import academic from './indonesia-academic.json';

export function summarizePublishedIndonesia(rows: typeof catalogue = catalogue, profiles: Record<string, unknown> = academic) {
  const programmes = new Set(rows.map(row => row.id));
  const reviewed = Object.keys(profiles).filter(key => programmes.has(key)).length;
  return {
    universities: [...new Map(rows.map(row => [row.university_id, { id: row.university_id, name: row.university }])).values()],
    programmeCount: rows.length,
    facultyCount: new Set(rows.map(row => `${row.university_id}:${row.faculty}`)).size,
    reviewedSummaries: reviewed,
    summariesToReview: rows.length - reviewed,
    latestListingCheck: rows.map(row => row.source_checked_on).sort().at(-1) ?? null,
  };
}
