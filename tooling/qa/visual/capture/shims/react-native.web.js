// Shim de CAPTURE uniquement (BLOWY_QA_CAPTURE=1, plateforme web) : ré-exporte react-native-web
// et complète les API absentes du web dont l'absence ferait planter le rendu (sans changer leur
// sens : valeurs par défaut « préférence désactivée »).
import { AccessibilityInfo } from 'react-native-web';
export * from 'react-native-web';
if (typeof AccessibilityInfo.isReduceTransparencyEnabled !== 'function') AccessibilityInfo.isReduceTransparencyEnabled = () => Promise.resolve(false);
if (typeof AccessibilityInfo.isBoldTextEnabled !== 'function') AccessibilityInfo.isBoldTextEnabled = () => Promise.resolve(false);
if (typeof AccessibilityInfo.isGrayscaleEnabled !== 'function') AccessibilityInfo.isGrayscaleEnabled = () => Promise.resolve(false);
