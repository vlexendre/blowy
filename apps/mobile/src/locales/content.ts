/**
 * Libellés partagés (`@blowy/content`) dans la langue de l'app. Mêmes noms qu'avant :
 * `import { gaugeLabel } from '@/locales/content'` au lieu de `@blowy/content`.
 */
import { labels } from '@blowy/content';
import { liveMessages } from './runtime';

const shared = liveMessages(labels);

export const {
  poleLabel,
  gaugeLabel,
  formLabel,
  levelLabel,
  eventLabel,
  wordLabel,
  reportReasonLabel,
  needLabel,
  careLabel,
  shapeLabel,
  slotLabel,
  statGoalLabel,
  itemLabel,
} = shared;
