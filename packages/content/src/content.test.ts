import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ANONYMOUS_WORDS, PASSIONS } from '@blowy/domain';
import { DEFAULT_TUNING } from '@blowy/tuning';
import {
  ANONYMOUS_WORD_ENTRIES,
  DEPARTURE_TEMPLATES,
  EGG_QUESTIONS,
  EntrySchema,
  LIMIT_ENTRIES,
  LineTextSchema,
  MISSIONS,
  NOTIFICATION_TEMPLATES,
  PASSION_ENTRIES,
  PET_LINES,
  SCHOOL_ENTRIES,
  SUNDAY_ENTRIES,
  buildFrLocale,
  candidateLines,
} from './index.js';

describe('référentiels', () => {
  it('cardinalités : 4 écoles, 4 dimanches, 10 passions, 4 limites, 12 mots', () => {
    expect([SCHOOL_ENTRIES.length, SUNDAY_ENTRIES.length, PASSION_ENTRIES.length, LIMIT_ENTRIES.length, ANONYMOUS_WORD_ENTRIES.length]).toEqual([4, 4, 10, 4, 12]);
    expect(ANONYMOUS_WORD_ENTRIES.map((w) => w.id)).toEqual([...ANONYMOUS_WORDS]);
    expect(PASSION_ENTRIES.map((p) => p.id)).toEqual([...PASSIONS]);
  });
  it('matrice des dimanches couvre les 4 dimanches du contenu', () => {
    for (const a of SUNDAY_ENTRIES) for (const b of SUNDAY_ENTRIES) expect(DEFAULT_TUNING.matching.matrices.sunday[a.id][b.id]).toBeGreaterThanOrEqual(0);
  });
  it('questions de couvaison ≥ 12 à choix multiples ≥ 3 options ; couvrent 3 nuits × 4', () => {
    expect(EGG_QUESTIONS.length).toBeGreaterThanOrEqual(DEFAULT_TUNING.egg.nights * DEFAULT_TUNING.egg.questionsPerNight);
    for (const q of EGG_QUESTIONS) expect(q.options.length).toBeGreaterThanOrEqual(3);
  });
  it('missions ≥ 12 : critères observables, alternative accessible, jamais de visage requis', () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(12);
    for (const m of MISSIONS) {
      expect(m.criteria.length).toBeGreaterThan(0);
      expect(m.accessibleAlternative.length).toBeGreaterThan(0);
      expect(m.faceRequired).toBe(false);
      expect(m.criteria.join(' ')).not.toMatch(/visage|selfie|corps/i);
    }
  });
  it('répliques ≥ 80, variables allowlistées, aucune réplique physique ni parole humaine', () => {
    expect(PET_LINES.length).toBeGreaterThanOrEqual(80);
    for (const l of PET_LINES) expect(LineTextSchema.safeParse(l.fr).success, l.fr).toBe(true);
    expect(LineTextSchema.safeParse('Ton humain pense à toi').success).toBe(false);
    expect(LineTextSchema.safeParse('Tu es trop belle').success).toBe(false);
    expect(LineTextSchema.safeParse('Bonjour {email}').success).toBe(false);
  });
  it('chaque situation a une réplique pour chaque espèce et trait (repli générique)', () => {
    const situations = [...new Set(PET_LINES.map((l) => l.situation))];
    for (const s of situations) for (const sp of ['GASTON', 'PIA', 'NINO', 'SUZIE'] as const) for (const tr of ['KIND', 'MISCHIEVOUS'] as const) expect(candidateLines(sp, tr, s).length).toBeGreaterThan(0);
    expect(candidateLines('NINO', 'MISCHIEVOUS', 'REFUSAL').every((l) => l.species === 'NINO' && l.trait === 'MISCHIEVOUS')).toBe(true);
  });
  it('modèles de départ clairement système', () => {
    for (const t of DEPARTURE_TEMPLATES) {
      expect(t.system).toBe(true);
      expect(t.fr.startsWith('Message de Blowy')).toBe(true);
    }
    for (const t of [...DEPARTURE_TEMPLATES, ...NOTIFICATION_TEMPLATES]) expect(EntrySchema.safeParse(t).success).toBe(true);
  });
  it('locales/fr.json généré, à jour et sans doublon', () => {
    const generated = buildFrLocale();
    const onDisk = JSON.parse(readFileSync(new URL('../locales/fr.json', import.meta.url), 'utf8'));
    expect(onDisk).toEqual(generated);
    for (const [k, v] of Object.entries(generated)) expect(EntrySchema.safeParse({ key: k, fr: v }).success, k).toBe(true);
  });
});

describe('contenus V5', () => {
  const v5 = () => import('./index.js');
  it('souvenirs : un texte par type, variables allowlistées', async () => {
    const { MEMORY_ENTRIES } = await v5();
    const { PET_MEMORY_KINDS } = await import('@blowy/domain');
    expect(MEMORY_ENTRIES.map((m) => m.id).sort()).toEqual([...PET_MEMORY_KINDS].sort());
    for (const m of MEMORY_ENTRIES) expect(EntrySchema.safeParse(m).success, m.key).toBe(true);
  });
  it('accessoires : tout identifiant du tuning existe dans le catalogue, aucun doublon', async () => {
    const { ACCESSORIES } = await v5();
    const ids = new Set(ACCESSORIES.map((a) => a.id));
    expect(ids.size).toBe(ACCESSORIES.length);
    const t = DEFAULT_TUNING;
    for (const id of [...t.memories.accessoryUnlocks.map((u) => u.accessoryId), ...t.memories.kindUnlocks.map((u) => u.accessoryId), t.accessories.referralAccessoryId, ...t.accessories.plusMonthlyAccessoryIds]) expect(ids.has(id), id).toBe(true);
  });
  it('brise-glace : ≥ 12 questions soufflées, répliques sans physique ni parole humaine', async () => {
    const { ICEBREAKER_PROMPTS, ICEBREAKER_MESSAGES, ICEBREAKER_MOMENTS } = await v5();
    expect(ICEBREAKER_PROMPTS.length).toBeGreaterThanOrEqual(12);
    for (const l of [...ICEBREAKER_PROMPTS, ...ICEBREAKER_MESSAGES]) expect(LineTextSchema.safeParse(l.fr).success, l.fr).toBe(true);
    for (const m of ICEBREAKER_MOMENTS) expect(ICEBREAKER_MESSAGES.some((x) => x.moment === m)).toBe(true);
  });
  it('notifications V5 : catalogue §9 complet, sans urgence ; variantes discrètes neutres', async () => {
    const { NOTIFICATION_TEMPLATES_V5, DISCREET_TEMPLATE_VARIABLES, templateVariables } = await v5();
    const expected = ['outing.request_open', 'outing.request_last_call', 'outing.invited', 'outing.invite_reminder', 'outing.unplaced', 'outing.formed', 'outing.venue_revealed', 'outing.today', 'outing.checkin_open', 'outing.cancelled', 'outing.composition_changed', 'outing.refund_done', 'votes.opened', 'votes.reminder', 'connection.friend', 'connection.plus', 'votes.closed', 'duo.proposal', 'duo.matched', 'duo.unlocked', 'duo.exchange_ending', 'duo.date_proposed', 'duo.date_confirmed', 'duo.date_reminder', 'duo.checkin_open', 'duo.deadline_soon', 'duo.after_vote', 'duo.closed', 'message.human', 'reliability.paused', 'safety.alert_sent', 'neighborhood.launched', 'pet.memory', 'outing.seeding_invited', 'team.member_joined', 'outing.confirmed', 'outing.faces'];
    expect(NOTIFICATION_TEMPLATES_V5.map((n) => n.templateKey).sort()).toEqual([...expected].sort());
    for (const k of DEFAULT_TUNING.notifications.v5.transactionalKeys) expect(NOTIFICATION_TEMPLATES_V5.find((n) => n.templateKey === k)?.transactional, k).toBe(true);
    const urgency = /derni[eè]re chance|vite|urgent|plus que \d|expire|compte à rebours|offre|promo|seulement ce soir/i;
    for (const n of NOTIFICATION_TEMPLATES_V5) {
      expect(EntrySchema.safeParse({ key: n.key, fr: n.fr }).success, n.key).toBe(true);
      expect(n.fr).not.toMatch(urgency);
      // une notification ne révèle jamais un vote individuel
      expect(n.fr).not.toMatch(/a voté|t’a choisi|t'a choisi|a dit non|a dit plus/i);
      expect(templateVariables(n.discreetFr).every((v) => (DISCREET_TEMPLATE_VARIABLES as readonly string[]).includes(v)), n.key).toBe(true);
      expect(n.discreetFr).not.toMatch(/sortie|duo|rendez-vous|bande|pet|vote/i);
    }
    expect(NOTIFICATION_TEMPLATES_V5.find((n) => n.templateKey === 'pet.memory')?.inAppOnly).toBe(true);
  });
  it('messages système neutres, libellé PLUS explicite, créneaux', async () => {
    const { SYSTEM_MESSAGES_V5, VOTE_LABELS, slotLabelKey, SLOT_LABELS } = await v5();
    for (const m of SYSTEM_MESSAGES_V5) expect(EntrySchema.safeParse(m).success, m.key).toBe(true);
    const { VENUE_OFFERS, ACTIVITY_ENTRIES } = await v5();
    const { ACTIVITY_KINDS } = await import('@blowy/domain');
    // V5.1 : consommation non incluse
    for (const o of VENUE_OFFERS) expect(o.fr).not.toMatch(/inclus/);
    expect(ACTIVITY_ENTRIES.map((a) => a.id)).toEqual([...ACTIVITY_KINDS]);
    expect(VOTE_LABELS.find((v) => v.id === 'PLUS_NOTE')?.fr).toBe('Si l’autre dit ami·e, vous restez ami·es.');
    expect(slotLabelKey(4, 19)).toBe('slot.thu_evening');
    expect(SLOT_LABELS.some((s) => s.key === slotLabelKey(7, 11))).toBe(true);
  });
});
