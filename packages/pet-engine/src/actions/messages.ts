/**
 * Aller-retour de messages humains publiés : +2 XP si la réponse de l'autre arrive dans les
 * 24 h ; +10 XP au premier aller-retour admissible du jour ; plafond 20 XP/jour bonus inclus
 * (plafond de base appliqué avant k·m). Une séquence du même auteur = un seul tour ouvert.
 * Gère aussi la dette de réponse (fiabilité) et la remise à zéro du silence.
 */
import { HOUR_MS } from '@blowy/domain';
import { grantLinkXp, recordContribution, touchInteraction } from '../relationship/index.js';
import { localDayKey } from '../time/index.js';
import { otherSide } from '../shared/index.js';
import { defineHandler } from './handler.js';
import { liveRelationship, relDaily } from './guards.js';

export const messageHandler = defineHandler('MESSAGE_PUBLISHED', (world, ev, ctx, out) => {
  // Messages système/suggestions non envoyées/spam/refusés : jamais transmis comme `human`.
  if (!ev.human) return;
  const rel = liveRelationship(world, ev.relationshipId, out);
  if (!rel) return;
  const t = ctx.tuning;
  const m = t.actions.messages;
  const author = ev.authorSide;
  const other = otherSide(author);
  rel.silenceMs = 0;

  // L'auteur répond : sa dette s'éteint ; récupération de fiabilité si réponse < 24 h (une fois par jour).
  const debt = rel.sides[author].replyDebtMs;
  if (debt !== null && debt <= t.reliability.recoveryReplyWithinHours * HOUR_MS) {
    const dayKey = localDayKey(ctx.now, rel.tz);
    if (rel.sides[author].recoveryDayKey !== dayKey) {
      rel.sides[author].recoveryDayKey = dayKey;
      out.push({ type: 'RELIABILITY_RECOVERY_ELIGIBLE', relationshipId: rel.id, side: author, dayKey });
    }
  }
  rel.sides[author].replyDebtMs = null;
  rel.sides[author].ghostPenalized = false;
  // L'autre doit maintenant une réponse (ne s'arme qu'au premier message de la séquence).
  if (rel.sides[other].replyDebtMs === null) rel.sides[other].replyDebtMs = 0;

  const turn = rel.messageTurn;
  const closesRoundTrip = turn !== null && turn.authorSide === other && ctx.now - turn.atMs <= m.replyWindowHours * HOUR_MS;
  // Aller-retour bouclé → tour remis à zéro (A,B,A,B = 2 AR). Messages consécutifs du même auteur : le tour reste ouvert à sa date initiale.
  if (closesRoundTrip) rel.messageTurn = null;
  else if (turn === null || turn.authorSide !== author) rel.messageTurn = { authorSide: author, atMs: ctx.now };
  if (!closesRoundTrip) {
    recordContribution(rel, author, 'message', ctx.now, t);
    return;
  }

  const counts = relDaily(rel, ctx);
  const bonus = counts.firstRoundTrip === 0 ? m.firstRoundTripBonusXp : 0;
  const base = Math.min(m.roundTripXp + bonus, Math.max(0, m.dailyXpCap - counts.messageXp));
  touchInteraction(rel, t);
  if (base <= 0) {
    out.push({ type: 'NO_GAIN_CAP_REACHED', action: 'MESSAGE', relationshipId: rel.id, petId: null });
  } else {
    counts.firstRoundTrip = 1;
    counts.messageXp += base;
    grantLinkXp(world, rel, 'MESSAGE', base, ctx, out);
  }
  recordContribution(rel, author, 'message', ctx.now, t);
});
