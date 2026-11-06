/** Place de sortie et droits (spec-v5 §6, §7.4 ; contrats `payments` de G). */
import {
  AllowancesViewSchema,
  OutingCreditsViewSchema,
  PlusCancelResponseSchema,
  PlusCheckoutResponseSchema,
  ProductsResponseV5Schema,
} from '@blowy/api-contract';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';

export function createPaymentsRepository(api: Api) {
  return {
    products: () => api.request('GET', routes.products, ProductsResponseV5Schema),
    allowances: () => api.request('GET', routes.allowances, AllowancesViewSchema),
    credits: () => api.request('GET', routes.credits, OutingCreditsViewSchema),
    plusCancel: (commandId: string) =>
      api.request('POST', routes.plusCancel, PlusCancelResponseSchema, {}, { commandId }),
    plusCheckout: (commandId: string) =>
      api.request('POST', routes.plusCheckout, PlusCheckoutResponseSchema, {}, { commandId }),
  };
}
