export function getExecutionSql(selectedSql: string | undefined, fullSql: string): string {
  return selectedSql?.trim() ? selectedSql : fullSql;
}
