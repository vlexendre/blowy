import { useWindowDimensions } from 'react-native';

/** Sous cette hauteur d'écran (iPhone SE, 375×667), la jumelle compacte de la maquette. */
const SMALL = 700;

/** Petit écran : panneau de 168 pt et une seule étape faite au-dessus de celle du jour. */
export function useHomeCompact(): boolean {
  return useWindowDimensions().height < SMALL;
}
