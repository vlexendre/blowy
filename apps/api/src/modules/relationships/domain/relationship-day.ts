/** Jour de relation (YYYY-MM-DD) dans la timezone stable de la relation (calcul serveur). */
export function relationshipDay(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}
