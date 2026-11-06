/**
 * Réglages serveur : notifications (dont le mode discret, relu ici — V5 §9.3) et « éviter les
 * personnes que je connais » (V5.4 §A6, protocole `oprf-p256-v1` : aucun numéro en clair envoyé).
 */
import { ContactAvoidanceStatusSchema, NotificationSettingsViewSchema, UpdateNotificationSettingsRequestSchema, type UpdateNotificationSettingsRequest } from '@blowy/api-contract';
import type { Api } from '../../../core/api/client';
import { routes } from '../../../core/api/routes';

export function createSettingsRepository(api: Api) {
  return {
    notifications: () => api.request('GET', routes.notificationSettings, NotificationSettingsViewSchema),
    putNotifications: async (commandId: string, body: UpdateNotificationSettingsRequest) => api.request('PUT', routes.notificationSettings, NotificationSettingsViewSchema, UpdateNotificationSettingsRequestSchema.parse(body), { commandId }),
    avoidance: () => api.request('GET', routes.contactAvoidance, ContactAvoidanceStatusSchema),
    declineAvoidance: (commandId: string) => api.request('POST', `${routes.contactAvoidance}/decline`, ContactAvoidanceStatusSchema, {}, { commandId }),
    disableAvoidance: (commandId: string) => api.request('DELETE', routes.contactAvoidance, ContactAvoidanceStatusSchema, undefined, { commandId }),
  };
}
