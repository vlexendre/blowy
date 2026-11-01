/**
 * Port d'injection des sources d'images : ui-mobile ne fait aucun `require()` d'asset. L'app
 * fournit la table générée `@blowy/sprites/sources` (Metro) via <SpriteSourceProvider>.
 * Un chemin absent renvoie null : le composant affiche alors un placeholder déclaré.
 */
import { createContext, useContext, type ReactNode } from 'react';

export type SpriteSourceMap = Readonly<Record<string, number>>;
const SpriteSourceContext = createContext<SpriteSourceMap>({});

export function SpriteSourceProvider({ sources, children }: { sources: SpriteSourceMap; children: ReactNode }) {
  return <SpriteSourceContext.Provider value={sources}>{children}</SpriteSourceContext.Provider>;
}

export function useSpriteSource(path: string | null | undefined): number | null {
  const map = useContext(SpriteSourceContext);
  if (!path) return null;
  return map[path] ?? null;
}
