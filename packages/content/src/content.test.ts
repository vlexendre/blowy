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
    for (const id of [...t.memories.accessoryUnlocks.map((u) => u.accessoryId), ...t.memories.kindUnlocks.map((u) => u.accessoryId), t.accessories.referralAccessoryId, ...(t.accessories.plusMonthlyAccessoryIds ?? [])]) expect(ids.has(id), id).toBe(true);
  });
  it('brise-glace : ≥ 12 questions soufflées, répliques sans physique ni parole humaine', async () => {
    const { ICEBREAKER_PROMPTS, ICEBREAKER_MESSAGES, ICEBREAKER_MOMENTS } = await v5();
    expect(ICEBREAKER_PROMPTS.length).toBeGreaterThanOrEqual(12);
    for (const l of [...ICEBREAKER_PROMPTS, ...ICEBREAKER_MESSAGES]) expect(LineTextSchema.safeParse(l.fr).success, l.fr).toBe(true);
    for (const m of ICEBREAKER_MOMENTS) expect(ICEBREAKER_MESSAGES.some((x) => x.moment === m)).toBe(true);
  });
  it('notifications V5 : catalogue §9 complet, sans urgence ; variantes discrètes neutres', async () => {
    const { NOTIFICATION_TEMPLATES_V5, DISCREET_TEMPLATE_VARIABLES, templateVariables } = await v5();
    const expected = ['outing.request_open', 'outing.request_last_call', 'outing.invited', 'outing.invite_reminder', 'outing.unplaced', 'outing.formed', 'outing.venue_revealed', 'outing.today', 'outing.checkin_open', 'outing.cancelled', 'outing.composition_changed', 'outing.refund_done', 'votes.opened', 'votes.reminder', 'connection.friend', 'connection.plus', 'votes.closed', 'duo.proposal', 'duo.matched', 'duo.unlocked', 'duo.exchange_ending', 'duo.date_proposed', 'duo.date_confirmed', 'duo.date_reminder', 'duo.checkin_open', 'duo.deadline_soon', 'duo.after_vote', 'duo.closed', 'message.human', 'reliability.paused', 'safety.alert_sent', 'neighborhood.launched', 'pet.memory', 'outing.seeding_invited', 'team.member_joined', 'outing.confirmed', 'outing.faces', 'outing.request_answer_at', 'referral.next_outing_free'];
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

describe('V5.6 : règles uniques et délais calculés (concept-v5.6 §A)', () => {
  it('une formulation par règle ; jamais « les soirs de sortie », « position en continu », « 2ᵉ sortie », « trimestre »', async () => {
    const { RULES_V56, NOTIFICATION_TEMPLATES_V5 } = await import('./catalog/v5.js');
    expect(new Set(RULES_V56.map((r) => r.key)).size).toBe(RULES_V56.length);
    for (const r of RULES_V56) expect(EntrySchema.safeParse(r).success, r.key).toBe(true);
    const all = [...RULES_V56.map((r) => r.fr), ...NOTIFICATION_TEMPLATES_V5.map((n) => n.fr)].join('\n');
    expect(all).not.toMatch(/soirs de sortie|position en continu|2ᵉ sortie|2e sortie|trimestre|lundi 21 h/i);
    expect(RULES_V56.find((r) => r.id === 'plus_breakeven')?.fr).toMatch(/3ᵉ sortie du mois/);
    expect(RULES_V56.find((r) => r.id === 'oncall')?.fr).toMatch(/pendant toute ta sortie ou ton rendez-vous/);
  });
  it('délai de réponse calculé depuis la composition J − 3 21 h (samedi → mercredi soir ; mardi → samedi soir)', async () => {
    const { answerAtFr, answerAtFromInstants } = await import('./catalog/v5.js');
    expect(answerAtFr({ pet: 'Nino', slotIsoWeekday: 6, composeIsoWeekday: 3, composeHourLocal: 21 })).toBe('Nino cherche ta sortie de samedi : réponse mercredi soir.');
    // Mardi 17 nov. 19 h 30 (Lyon) → composition samedi 14 nov. 21 h.
    expect(answerAtFromInstants('Nino', new Date('2026-11-17T18:30:00Z'), new Date('2026-11-14T20:00:00Z'), 'Europe/Paris')).toBe('Nino cherche ta sortie de mardi : réponse samedi soir.');
  });
});

describe('V5.7 : phrases canoniques (concept-v5.7, spec §2.7)', () => {
  it('trois sorties distinctes, règle d’annulation, rappel en quelques minutes, astreinte à la 3ᵉ personne ; jamais « inscrits »', async () => {
    const { RULES_V57, VENUE_WELCOME_TEMPLATE, RULES_V56 } = await import('./catalog/v5.js');
    const by = (id: string) => RULES_V57.find((r) => r.id === id)?.fr;
    expect(by('safety_exit')).toBe('Tu peux partir à tout moment pour ta sécurité : sans pénalité, ta place est remboursée.');
    expect(by('knows_someone')).toBe('Une fois par mois, on te change de groupe ou on te rembourse. Au-delà, l’équipe regarde avec toi : ce n’est jamais une absence.');
    expect(by('emergency')).toBe('Une fois par mois, sans pénalité. Ta place n’est pas remboursée.');
    expect(by('emergency_label')).toBe('Je ne le sens pas');
    expect(by('cancel')).toBe('Annulation gratuite jusqu’à la veille 18 h. Ensuite, c’est une absence, sauf raison de sécurité, « je connais quelqu’un ici » ou imprévu.');
    expect(by('help_callback')).toBe('Quelqu’un de l’équipe te rappelle en quelques minutes.');
    expect(by('oncall_guardian_outing')).toMatch(/toute la sortie de \{prenom\}/);
    for (const r of [...RULES_V57, VENUE_WELCOME_TEMPLATE]) expect(EntrySchema.safeParse(r).success, r.key).toBe(true);
    expect(new Set(RULES_V57.map((r) => r.key)).size).toBe(RULES_V57.length);
    const all = [...RULES_V56, ...RULES_V57].map((r) => r.fr).join('\n');
    expect(all).not.toMatch(/inscrits|soirs de sortie|position en continu/i);
  });
});

describe('V5.9 : catalogue d’activités aligné sur design/v5/facts.json', () => {
  it('chaque « activite » des maquettes a son entrée (libellé exact, type, durée)', async () => {
    const { ACTIVITY_DETAILS } = await import('./catalog/v5.js');
    const { ACTIVITY_KINDS } = await import('@blowy/domain');
    const facts = JSON.parse(readFileSync(new URL('../../../design/v5/facts.json', import.meta.url), 'utf8')) as Record<string, unknown>;
    const labels = new Set<string>();
    const walk = (o: unknown): void => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') {
        for (const [k, v] of Object.entries(o)) {
          if (k === 'activite' && typeof v === 'string') labels.add(v);
          else walk(v);
        }
      }
    };
    walk(facts);
    expect(labels.size).toBeGreaterThan(3);
    const norm = (s: string) => s.replace(/['’]/g, '’');
    for (const l of labels) expect(ACTIVITY_DETAILS.some((d) => norm(d.fr) === norm(l)), l).toBe(true);
    for (const d of ACTIVITY_DETAILS) {
      expect((ACTIVITY_KINDS as readonly string[]).includes(d.kind)).toBe(true);
      expect(d.durationMinutes).toBeGreaterThan(0);
    }
  });
});
