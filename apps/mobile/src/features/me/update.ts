import type { Me, UpdateMeBody } from '@blowy/contract';

/** Ce que `PATCH /v1/me` changera, appliqué d'avance (le prénom, l'identité, « montrer mes habitudes »). */
export function withUpdate(me: Me, body: UpdateMeBody): Me {
  const identity = { ...me.identity };
  if (body.gender !== undefined) identity.gender = body.gender;
  if (body.locale !== undefined) identity.locale = body.locale;
  if (body.discreet !== undefined) identity.discreet = body.discreet;
  return {
    ...me,
    identity,
    displayName: body.displayName?.trim() || me.displayName,
    showHabits: body.showHabits ?? me.showHabits,
  };
}
