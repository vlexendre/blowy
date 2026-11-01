/**
 * Disponibilité des achats (pure) : même règle que selectPurchasesAdapter (agent G) — clé
 * publique du store présente, ou environnement non-production (démo locale étiquetée).
 */
export function purchasesAvailable(platform: string, keys: { ios?: string; android?: string }, blowyEnv: string): boolean {
  const key = platform === 'ios' ? keys.ios : platform === 'android' ? keys.android : undefined;
  return !!key || blowyEnv !== 'production';
}
