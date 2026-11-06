/** Outils internes (jamais hors `EXPO_PUBLIC_BLOWY_ENV=local`). */
import { env } from '../../core/config/env';

export const devRoutesEnabled = env.blowyEnv === 'local';
export { KitchenSinkScreen } from './ui/KitchenSinkScreen';
