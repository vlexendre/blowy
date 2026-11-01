/** Registre des handlers (table Command). Ajouter une action = ajouter une entrée ici. */
import type { HandlerRegistry } from './handler.js';
import { callHandler } from './call.js';
import { HUG_SPEC, PLAY_SPEC, runTogether } from './together.js';
import { messageHandler } from './messages.js';
import { missionHandler } from './mission.js';
import { giftHandler } from './gift.js';
import { feedHandler, healHandler } from './care.js';
import { feedFriendHandler } from './feed-friend.js';
import { endHandler, gatesHandler, moveInHandler, pauseHandler } from './lifecycle.js';
import { eggAnswerHandler, eggNameHandler, eggOpenHandler, eggTapHandler } from './egg.js';
import { defineHandler } from './handler.js';

const handlers = [
  callHandler,
  defineHandler('HUG', (w, e, c, o) => runTogether(HUG_SPEC, w, e, c, o)),
  defineHandler('PLAY', (w, e, c, o) => runTogether(PLAY_SPEC, w, e, c, o)),
  defineHandler('ADVANCE', () => undefined), // l'avance du temps est faite par reduce avant tout handler
  messageHandler,
  missionHandler,
  giftHandler,
  feedHandler,
  healHandler,
  feedFriendHandler,
  gatesHandler,
  pauseHandler,
  moveInHandler,
  endHandler,
  eggOpenHandler,
  eggAnswerHandler,
  eggTapHandler,
  eggNameHandler,
] as const;

export const HANDLERS: HandlerRegistry = Object.fromEntries(handlers.map((h) => [h.type, h])) as HandlerRegistry;
