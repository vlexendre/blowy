import type { ReactNode } from 'react';
import { View } from 'react-native';

export interface StackProps {
  children?: ReactNode;
  /** Écart vertical entre les enfants (pt). Défaut 10, comme `.wrap` des maquettes. */
  gap?: number;
  /** Marge au-dessus (pt). */
  top?: number;
  /** Occupe toute la hauteur disponible (un enfant en `marginTop: 'auto'` se cale en bas). */
  grow?: boolean;
}

/** Colonne d'écran : empile les blocs avec l'écart des maquettes. */
export function Stack({ children, gap = 10, top = 0, grow }: StackProps) {
  return <View style={{ gap, paddingTop: top, flexGrow: grow ? 1 : 0 }}>{children}</View>;
}
