/**
 * Widgets iOS et activités en direct : publie l'état des widgets et tient les activités à jour à partir des données
 * déjà lues par l'app (pet, série, défi du jour, liens). Appelé une fois, dans le layout des onglets.
 * Ne fait rien hors iOS (voir `widgets` dans core).
 */
import type { Pet } from '@blowy/contract';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { config, keys, useApi, widgets, type ActivityToken } from '@/core';
import { useLinks } from '@/features/links';
import { usePet } from '@/features/pet';
import type { Gate } from '@/features/session';

import { challengeActivity, decideRunning, linkActivity, outingActivity, widgetSnapshot, type ActivityInputs, type DesiredActivity } from './state';

export { outingActivity } from './state';

const active = (): boolean => AppState.currentState === 'active';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Série seule (lecture légère) et accueil des rituels, partagés avec les écrans des rituels par leurs clés. */
function useRituals(enabled: boolean) {
  const api = useApi();
  const streak = useQuery({ queryKey: keys.ritualsStreak, queryFn: api.rituals.streak, enabled, staleTime: 60_000 });
  const today = useQuery({ queryKey: keys.ritualsToday, queryFn: api.rituals.today, enabled, staleTime: 5 * 60_000 });
  return { streak, today };
}

async function syncActivities(i: ActivityInputs, push: boolean): Promise<void> {
  if (!widgets.activities.enabled()) return;
  const running = widgets.activities.list();
  for (const activity of running) {
    const decision = decideRunning(activity, i);
    if (decision.action === 'update') await widgets.activities.update(activity.id, decision.state);
    if (decision.action === 'end') {
      await widgets.activities.end(activity.id, decision.state, decision.dismissAfterSeconds === 0 ? { immediate: true } : { afterSeconds: decision.dismissAfterSeconds });
    }
  }
  const wanted = [challengeActivity(i), linkActivity(i)].filter((a): a is DesiredActivity => a !== null);
  for (const a of wanted) {
    if (running.some((r) => r.attributes.kind === a.kind)) continue;
    await widgets.activities.start(a.key, a.attributes, a.state, push);
  }
}

/** Jetons APNs des activités → API (seulement quand l'API sait les ranger : `config.liveActivityPush`). */
function useActivityTokens(enabled: boolean) {
  const api = useApi();
  const sent = useRef(new Set<string>());
  useEffect(() => {
    if (!enabled || !config.liveActivityPush || !widgets.available) return;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/Paris';
    return widgets.activities.onToken((t: ActivityToken) => {
      if (sent.current.has(t.token)) return;
      sent.current.add(t.token);
      // Série d'un lien : le lien concerné, pour que l'API ne termine que cette activité quand tu y écris.
      const linkId = t.activity === 'link' ? widgets.activities.list().find((a) => a.id === t.activityId)?.attributes.url.split('/').pop() : undefined;
      void api.notifications
        .registerDevice({
          token: t.token,
          platform: 'ios',
          timeZone,
          kind: 'apns_live_activity',
          liveActivity: { use: t.use, ...(t.activity ? { activity: t.activity } : {}), ...(t.activityId ? { activityId: t.activityId } : {}), ...(linkId && UUID.test(linkId) ? { linkId } : {}) },
        })
        .catch(() => sent.current.delete(t.token));
    });
  }, [api, enabled]);
}

/**
 * Tient les widgets et les activités en direct à jour. `gate` : celui du layout des onglets ; à la déconnexion,
 * les widgets repassent sur « Ouvre Minimoa » et les activités sont retirées.
 */
export function useWidgetSync(gate: Gate): void {
  const ready = gate === 'ready' && widgets.available;
  const pet = usePet();
  const links = useLinks();
  const { streak, today } = useRituals(ready);
  useActivityTokens(ready);

  const petData = pet.data?.pet;
  const readAt = pet.dataUpdatedAt;

  // Widgets : publié seulement app au premier plan (Apple ne compte alors pas les rechargements).
  useEffect(() => {
    if (!ready || !petData || !active()) return;
    widgets.publish(
      widgetSnapshot({
        pet: petData,
        readAt: new Date(readAt || Date.now()),
        streak: streak.data ?? null,
        today: today.data ?? null,
      }),
    );
  }, [ready, petData, readAt, streak.data, today.data]);

  // Activités en direct : démarrer, mettre à jour, terminer.
  useEffect(() => {
    if (!ready || !petData || !active()) return;
    void syncActivities({ pet: petData, today: today.data ?? null, streak: streak.data ?? null, links: links.data ?? [], now: new Date() }, config.liveActivityPush);
  }, [ready, petData, today.data, streak.data, links.data]);

  // Déconnexion : plus rien de la personne sur l'écran verrouillé.
  useEffect(() => {
    if (gate !== 'signedOut' || !widgets.available) return;
    widgets.clear();
    for (const a of widgets.activities.list()) void widgets.activities.end(a.id, null, { immediate: true });
  }, [gate]);
}

/** Pour l'écran de la sortie (à venir) : « Nino est de sortie » pendant `hours` heures. */
export async function startOuting(pet: Pick<Pet, 'name' | 'species'>, hours = 3): Promise<string | null> {
  const a = outingActivity(pet, new Date(), hours);
  return widgets.activities.start(a.key, a.attributes, a.state, config.liveActivityPush);
}

/** Retour de sortie : l'activité affiche « De retour » quelques minutes puis s'efface. */
export async function endOuting(): Promise<void> {
  for (const a of widgets.activities.list()) {
    if (a.attributes.kind === 'outing') await widgets.activities.end(a.id, { ...a.state, done: true }, { afterSeconds: 10 * 60 });
  }
}
