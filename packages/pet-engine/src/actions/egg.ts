/** Handlers de l'œuf : délèguent au module egg/ (logique écrite une seule fois). */
import { answer, composeBabyName, openSession, tap } from '../egg/index.js';
import { defineHandler, reject } from './handler.js';

export const eggOpenHandler = defineHandler('EGG_SESSION_OPEN', (world, ev, ctx, out) => {
  const egg = world.eggs[ev.eggId];
  if (!egg) return reject(out, 'NOT_FOUND');
  openSession(egg, ctx, out);
});

export const eggAnswerHandler = defineHandler('EGG_ANSWER', (world, ev, ctx, out) => {
  const egg = world.eggs[ev.eggId];
  if (!egg) return reject(out, 'NOT_FOUND');
  if (!answer(egg, ev.night, ev.question, ev.side, ev.choice, ctx, out)) reject(out, 'EGG_NOT_OPEN');
});

export const eggTapHandler = defineHandler('EGG_TAP', (world, ev, ctx, out) => {
  const egg = world.eggs[ev.eggId];
  if (!egg) return reject(out, 'NOT_FOUND');
  if (!tap(egg, ev.side, ctx, out)) reject(out, 'EGG_INVALID');
});

export const eggNameHandler = defineHandler('EGG_NAME_VOTE', (world, ev, ctx, out) => {
  const egg = world.eggs[ev.eggId];
  if (!egg) return reject(out, 'NOT_FOUND');
  if (egg.status !== 'HATCHED' || egg.babyName !== null) return reject(out, 'EGG_INVALID');
  egg.nameVotes[ev.side] = ev.name; // nom déjà modéré par le backend
  const [a, b] = egg.nameVotes;
  if (a === null || b === null) return;
  egg.babyName = composeBabyName([a, b], ctx.tuning);
  out.push({ type: 'EGG_NAMED', eggId: egg.id, name: egg.babyName });
});
