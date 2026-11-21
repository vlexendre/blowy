import { Inject, Injectable } from '@nestjs/common';
import type { AdminChemin, AdminCheminQuestion, AdminCheminQuestionBody, AdminCheminStats, AdminCheminUnit, AdminCheminUnitBody } from '@blowy/contract';
import { type CheminStatus, LOCALES, dayOf } from '@blowy/domain';
import type { Clock } from '../../../shared/clock';
import { DomainError } from '../../../shared/errors';
import { CLOCK } from '../../../shared/tokens';
import type { ByLocale, CheminContentRepository, CheminSessionsRepository, ContentQuestion, ContentUnit } from '../ports';
import { CHEMIN_CONTENT, CHEMIN_SESSIONS } from '../tokens';
import { CheminContentService } from './chemin-content';

/**
 * Garde-fou éditorial (docs/CHEMIN.md) : jamais de santé mentale, de religion, de politique ni d'orientation
 * sexuelle. Une liste de mots par langue ; un mot trouvé empêche de passer la question en « relue » ou « en ligne ».
 */
// Bords de mot qui connaissent les accents (« sélection » ne contient pas « élection »). « gauche » et « droite »
// retirés : trop de fausses alertes (« à gauche, à droite »).
const words = (w: string): RegExp => new RegExp(`(?<!\\p{L})(?:${w})(?!\\p{L})`, 'iu');
const FORBIDDEN = [
  words('religion|religieu\\p{L}*|dieu|église|mosquée|synagogue|prière|prier'),
  words('politique\\p{L}*|élection\\p{L}*|voter|vote|parti politique'),
  words('dépression|dépressi\\p{L}*|anxiété|anxieu\\p{L}*|suicid\\p{L}*|thérapie|psychiatr\\p{L}*|trouble mental'),
  words('homosexu\\p{L}*|hétéro\\p{L}*|bisexu\\p{L}*|gay|lesbienne|orientation sexuelle'),
  words('god|church|mosque|pray\\p{L}*|faith|politic\\p{L}*|election\\p{L}*|depress\\p{L}*|anxiety|therap\\p{L}*|suicid\\p{L}*|homosexual|heterosexual|lesbian|sexual orientation'),
  words('iglesia|dios|religión|política|elecciones|depresión|ansiedad|terapia|igreja|deus|religião|eleição|depressão|ansiedade|kerk|god|religie|politiek|verkiezing\\p{L}*|depressie|angst|therapie'),
];

const allTexts = (q: Pick<ContentQuestion, 'texts' | 'options'>): string[] =>
  LOCALES.flatMap((l) => {
    const t = q.texts[l];
    const opts = q.options.flatMap((o) => {
      const ot = o.texts[l];
      return ot ? [ot.label, ot.reaction] : [];
    });
    return t ? [t.text, t.opener, t.mid ?? '', ...opts] : opts;
  });

export function questionWarnings(q: Pick<ContentQuestion, 'texts' | 'options' | 'format'>): string[] {
  const out: string[] = [];
  for (const text of allTexts(q)) for (const re of FORBIDDEN) if (re.test(text)) out.push(`Sujet interdit possible : « ${text} »`);
  if (q.format === 'slider' && q.options.length !== 2) out.push('Un curseur a exactement 2 options (bout gauche, bout droit).');
  if (q.format !== 'slider' && (q.options.length < 2 || q.options.length > 4)) out.push('Un choix a 2 à 4 options.');
  for (const l of LOCALES) if (l !== 'fr' && !q.texts[l]) out.push(`Pas encore traduit : ${l} (le français s’affiche).`);
  return [...new Set(out)];
}
const blocking = (w: string): boolean => !w.startsWith('Pas encore traduit');

/** Administration de Ton chemin : contenu (brouillon → relue → en ligne) et compteur du jour. */
@Injectable()
export class CheminAdmin {
  constructor(
    @Inject(CHEMIN_CONTENT) private readonly repo: CheminContentRepository,
    @Inject(CHEMIN_SESSIONS) private readonly sessions: CheminSessionsRepository,
    @Inject(CheminContentService) private readonly content: CheminContentService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async overview(): Promise<AdminChemin> {
    const c = await this.repo.load();
    return {
      units: c.units.sort((a, b) => a.position - b.position).map(toAdminUnit),
      questions: c.questions.sort((a, b) => (a.stepId ?? '').localeCompare(b.stepId ?? '') || a.position - b.position).map(toAdminQuestion),
      stats: await this.stats(),
    };
  }

  async stats(): Promise<AdminCheminStats> {
    const day = dayOf(this.clock.now());
    const s = await this.sessions.statsForDay(day);
    return { day, sessionsToday: s.sessions, peopleToday: s.people, bonusToday: s.bonus };
  }

  async createQuestion(body: AdminCheminQuestionBody): Promise<AdminCheminQuestion> {
    const c = await this.repo.load();
    if (c.questions.some((q) => q.id === body.id)) throw new DomainError('conflict', 'Cette question existe déjà.');
    this.checkStep(c.units, body.stepId);
    const q = fromBody(body, 'draft', this.clock.now().toISOString());
    await this.repo.upsertQuestion(q);
    this.content.invalidate();
    return toAdminQuestion(q);
  }

  /** Une question relue qu'on modifie repasse en brouillon ; une question en ligne le reste (corriger une coquille). */
  async updateQuestion(id: string, body: AdminCheminQuestionBody): Promise<AdminCheminQuestion> {
    if (body.id !== id) throw new DomainError('invalid', 'L’identifiant ne change pas.');
    const c = await this.repo.load();
    const existing = c.questions.find((q) => q.id === id);
    if (!existing) throw new DomainError('not_found', 'Question introuvable.');
    this.checkStep(c.units, body.stepId);
    const status: CheminStatus = existing.status === 'reviewed' ? 'draft' : existing.status;
    const q = fromBody(body, status, this.clock.now().toISOString());
    if (status === 'live' && questionWarnings(q).some(blocking)) throw new DomainError('invalid', questionWarnings(q).filter(blocking).join(' '));
    await this.repo.upsertQuestion(q);
    this.content.invalidate();
    return toAdminQuestion(q);
  }

  async setQuestionStatus(id: string, status: CheminStatus): Promise<AdminCheminQuestion> {
    const q = (await this.repo.load()).questions.find((x) => x.id === id);
    if (!q) throw new DomainError('not_found', 'Question introuvable.');
    const problems = questionWarnings(q).filter(blocking);
    if (status !== 'draft' && problems.length > 0) throw new DomainError('invalid', problems.join(' '));
    const at = this.clock.now().toISOString();
    await this.repo.setQuestionStatus(id, status, at);
    this.content.invalidate();
    return toAdminQuestion({ ...q, status, updatedAt: at });
  }

  async createUnit(body: AdminCheminUnitBody): Promise<AdminCheminUnit> {
    const c = await this.repo.load();
    if (c.units.some((u) => u.id === body.id)) throw new DomainError('conflict', 'Cette unité existe déjà.');
    const stepIds = new Set(c.units.flatMap((u) => u.steps.map((s) => s.id)));
    if (body.steps.some((s) => stepIds.has(s.id))) throw new DomainError('conflict', 'Une de ces étapes existe déjà.');
    return this.saveUnit(body, 'draft', null);
  }

  async updateUnit(id: string, body: AdminCheminUnitBody): Promise<AdminCheminUnit> {
    if (body.id !== id) throw new DomainError('invalid', 'L’identifiant ne change pas.');
    const existing = (await this.repo.load()).units.find((u) => u.id === id);
    if (!existing) throw new DomainError('not_found', 'Unité introuvable.');
    return this.saveUnit(body, existing.status, existing);
  }

  private async saveUnit(body: AdminCheminUnitBody, status: CheminStatus, existing: ContentUnit | null): Promise<AdminCheminUnit> {
    const at = this.clock.now().toISOString();
    const unit: ContentUnit = {
      id: body.id,
      position: body.position,
      icon: body.icon,
      minBuild: body.minBuild,
      status,
      texts: clean(body.texts),
      updatedAt: at,
      steps: body.steps.map((s) => ({
        id: s.id,
        unitId: body.id,
        position: s.position,
        status: existing?.steps.find((x) => x.id === s.id)?.status ?? status,
        texts: clean(s.texts),
      })),
    };
    await this.repo.upsertUnit(unit);
    this.content.invalidate();
    const saved = (await this.repo.load()).units.find((u) => u.id === body.id) ?? unit;
    return toAdminUnit(saved);
  }

  async setUnitStatus(id: string, status: CheminStatus): Promise<AdminCheminUnit> {
    const at = this.clock.now().toISOString();
    if (!(await this.repo.setUnitStatus(id, status, at))) throw new DomainError('not_found', 'Unité introuvable.');
    this.content.invalidate();
    const u = (await this.repo.load()).units.find((x) => x.id === id);
    if (!u) throw new DomainError('not_found', 'Unité introuvable.');
    return toAdminUnit(u);
  }

  private checkStep(units: readonly ContentUnit[], stepId: string | null): void {
    if (stepId && !units.some((u) => u.steps.some((s) => s.id === stepId))) throw new DomainError('invalid', 'Étape inconnue.');
  }
}

/** Retire les langues vides (`undefined`) d'un corps validé. */
function clean<T>(texts: { fr: T } & Partial<Record<string, T | undefined>>): ByLocale<T> {
  return Object.fromEntries(Object.entries(texts).filter(([, v]) => v !== undefined)) as ByLocale<T>;
}

function fromBody(b: AdminCheminQuestionBody, status: CheminStatus, at: string): ContentQuestion {
  return {
    id: b.id,
    stepId: b.stepId,
    position: b.position,
    format: b.format,
    axis: b.axis,
    direction: b.direction,
    minBuild: b.minBuild,
    legacyTestId: b.legacyTestId,
    status,
    texts: clean(b.texts),
    options: b.options.map((o, i) => ({
      id: o.id,
      position: i,
      icon: o.icon,
      weight: o.weight,
      tag: o.tag,
      animation: o.animation,
      reactionMinBuild: o.reactionMinBuild,
      texts: clean(o.texts),
    })),
    updatedAt: at,
  };
}

const toAdminQuestion = (q: ContentQuestion): AdminCheminQuestion => ({
  id: q.id,
  stepId: q.stepId,
  position: q.position,
  format: q.format,
  axis: q.axis,
  direction: q.direction,
  minBuild: q.minBuild,
  legacyTestId: q.legacyTestId,
  texts: q.texts,
  options: [...q.options]
    .sort((a, b) => a.position - b.position)
    .map((o) => ({ id: o.id, icon: o.icon, weight: o.weight, tag: o.tag, animation: o.animation, reactionMinBuild: o.reactionMinBuild, texts: o.texts })),
  status: q.status,
  updatedAt: q.updatedAt,
  warnings: questionWarnings(q),
});

const toAdminUnit = (u: ContentUnit): AdminCheminUnit => ({
  id: u.id,
  position: u.position,
  icon: u.icon,
  minBuild: u.minBuild,
  status: u.status,
  texts: u.texts,
  steps: [...u.steps].sort((a, b) => a.position - b.position).map((s) => ({ id: s.id, position: s.position, status: s.status, texts: s.texts })),
});
