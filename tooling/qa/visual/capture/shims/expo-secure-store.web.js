// Shim de CAPTURE uniquement (BLOWY_QA_CAPTURE=1, plateforme web) : expo-secure-store n'a pas
// d'implémentation web. Stockage en localStorage préfixé, pour que le banc puisse injecter le
// jeton d'un compte de démo. Jamais résolu dans un build natif ni dans un build normal.
const P = 'blowy.qa.secure.';
const ls = () => (typeof localStorage === 'undefined' ? null : localStorage);
export const AFTER_FIRST_UNLOCK = 0;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 1;
export const ALWAYS = 2;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 3;
export const ALWAYS_THIS_DEVICE_ONLY = 4;
export const WHEN_UNLOCKED = 5;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 6;
export const isAvailableAsync = async () => true;
export const getItem = (k) => ls()?.getItem(P + k) ?? null;
export const setItem = (k, v) => void ls()?.setItem(P + k, v);
export const getItemAsync = async (k) => getItem(k);
export const setItemAsync = async (k, v) => setItem(k, v);
export const deleteItemAsync = async (k) => void ls()?.removeItem(P + k);
export const canUseBiometricAuthentication = () => false;
