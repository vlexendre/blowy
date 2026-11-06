/**
 * Intention de paiement en attente, gardée EN MÉMOIRE seulement (jamais dans l'URL ni le stockage :
 * le secret client ne doit pas fuiter dans l'historique, les journaux ou une capture d'écran).
 */
import type { PaymentRequest } from './payment.port';

const pending = new Map<string, PaymentRequest>();

export const setPendingPayment = (key: string, req: PaymentRequest): void => void pending.set(key, req);
export const peekPendingPayment = (key: string): PaymentRequest | undefined => pending.get(key);
export const clearPendingPayment = (key: string): void => void pending.delete(key);
