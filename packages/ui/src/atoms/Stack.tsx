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
  /** Rangée au lieu d'une colonne (boutons côte à côte, qui passent à la ligne si besoin). */
  direction?: 'column' | 'row';
  /** Alignement transversal (« center » : une puce centrée). */
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end';
}

/** Colonne d'écran : empile les blocs avec l'écart des maquettes. */
export function Stack({ children, gap = 10, top = 0, grow, direction = 'column', align }: StackProps) {
  return (
    <View pointerEvents="box-none" style={{ gap, paddingTop: top, flexGrow: grow ? 1 : 0, flexDirection: direction, flexWrap: direction === 'row' ? 'wrap' : 'nowrap', alignItems: align }}>
      {children}
    </View>
  );
}
