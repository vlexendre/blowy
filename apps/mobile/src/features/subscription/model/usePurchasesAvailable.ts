import { Platform } from 'react-native';
import { env } from '../../../core/config/env';
import { purchasesAvailable } from './availability';

export const usePurchasesAvailable = (): boolean => purchasesAvailable(Platform.OS, { ios: env.revenueCatIosKey, android: env.revenueCatAndroidKey }, env.blowyEnv);
