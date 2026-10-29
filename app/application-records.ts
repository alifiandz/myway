/** Application-specific preparation is keyed by the exact programme identifier. */
export function applicationRecord(records: Record<string,string>, programmeId: string, field: string): string {
 return records[`${programmeId}:${field}`] || '';
}
