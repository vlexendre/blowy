/**
 * Filtre des contenus publiés (App Review 1.2, audit B6), appliqué par l'API avant d'écrire quoi que ce soit.
 * Règles locales d'abord (`classifyText` du domaine : liste multilingue, normalisation contre les contournements),
 * puis, seulement quand la règle hésite et que c'est permis, la passerelle d'IA (fonction `moderation`, petit modèle,
 * budget strict). Décisions par surface (`decideModeration`) :
 * - prénom, nom du minimoa : refus clair et traduit (`content_refused`) ; jamais d'IA (rien ne sort du serveur) ;
 * - message : violation nette (mineur, menace, haine, sexe tarifé, arnaque) → non envoyé, refus clair, signalement
 *   automatique (urgent pour un mineur ou une menace ; suspension de 72 h pour du vocabulaire pédocriminel explicite) ;
 *   cas limite (insulte, sexe explicite) → envoyé, signalé à la modération, et garde-fou du minimoa à son auteur ;
 *   hésitation (lien nu) → envoyé ; l'IA confirme après coup seulement si les deux personnes du lien ont
 *   accepté qu'une IA lise leurs messages ; si elle refuse ou n'est pas permise, la règle (envoyé) reste ;
 * - note d'un signalement : jamais refusée, elle sert seulement à la priorité ;
 * - photo de profil : `PhotoCheck`.
 * Le texte refusé n'est jamais répété dans la réponse ; l'équipe le voit dans l'administration (extrait court).
 */
import { Inject, Injectable } from '@nestjs/common';
import { moderationPrompt, moderationSystem, refusedText } from '@blowy/content';
import { type Locale, type ModerationCategory, type ModerationDecision, chatReadingAllowed, classifyText, decideModeration, parseAiModeration } from '@blowy/domain';
import { AI_GATEWAY, type AiGateway } from '../../integrations/ai/ai-gateway';
import { Background } from '../../shared/background';
import { DomainError } from '../../shared/errors';
import { LINKS, PROFILES } from '../../shared/tokens';
import type { LinksRepository, MessageRecord } from '../links/ports';
import { CHAT_SETTINGS, type ChatSettingsRepository } from '../links/minimoas/ports';
import type { ProfilesRepository } from '../me/ports';
import { ReportDesk } from './report-desk';

/** Longueur de l'extrait gardé pour la modération quand un message n'est pas envoyé. */
const EXCERPT_CHARS = 280;
const excerpt = (text: string): string => (text.length > EXCERPT_CHARS ? `${text.slice(0, EXCERPT_CHARS)}…` : text);

/** Motif d'un signalement automatique selon la catégorie (`REPORT_REASONS` du contrat). */
const reasonOf = (c: ModerationCategory | null): string => (c === 'minor_sexual' ? 'mineur' : c === 'insult' || c === 'threat' || c === 'hate' ? 'harcelement' : 'contenu_inapproprie');

export interface ScreenedMessage {
  decision: ModerationDecision;
  locale: Locale;
}

@Injectable()
export class ContentFilter {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(CHAT_SETTINGS) private readonly chatSettings: ChatSettingsRepository,
    @Inject(AI_GATEWAY) private readonly ai: AiGateway,
    @Inject(Background) private readonly background: Background,
    @Inject(ReportDesk) private readonly desk: ReportDesk,
  ) {}

  /** Prénom ou nom du minimoa : lève `content_refused` (message clair, traduit) au moindre terme listé, lien ou contact. */
  checkName(surface: 'display_name' | 'pet_name', text: string, locale: Locale): void {
    const decision = decideModeration(surface, classifyText(text, locale));
    if (decision.outcome === 'block') {
      const category = decision.category;
      throw new DomainError('content_refused', (l) => refusedText(l, surface, category), surface === 'pet_name' ? 'petName' : 'displayName');
    }
  }

  /** Catégorie grave d'une note de signalement (pour la priorité ; la note n'est jamais refusée). */
  noteCategory(details: string | null, locale: Locale): { category: ModerationCategory | null; explicitMinor: boolean } {
    if (!details) return { category: null, explicitMinor: false };
    const v = classifyText(details, locale);
    return { category: decideModeration('report_note', v).category, explicitMinor: false };
  }

  /**
   * Avant d'envoyer un message : bloque une violation nette (signalement automatique, puis `content_refused`).
   * Rend la décision à passer à `afterMessage`.
   */
  async screenMessage(input: { userId: string; linkId: string; text: string }): Promise<ScreenedMessage> {
    const profile = await this.profiles.findById(input.userId);
    const locale = profile?.locale ?? 'fr';
    const verdict = classifyText(input.text, locale);
    const decision = decideModeration('message', verdict);
    if (decision.outcome === 'block') {
      // Seulement dans un lien de la personne (sinon l'envoi échouera de toute façon, sans signalement).
      const link = await this.links.findById(input.linkId);
      if (link && (link.userA === input.userId || link.userB === input.userId)) {
        await this.desk.file({
          reporter: null,
          targetUser: input.userId,
          linkId: input.linkId,
          messageId: null,
          reason: reasonOf(decision.category),
          details: `Message non envoyé : « ${excerpt(input.text)} »`,
          source: 'filter',
          category: decision.category,
          explicitMinor: verdict.explicitMinor,
        });
      }
      const category = decision.category;
      throw new DomainError('content_refused', (l) => refusedText(l, 'message', category));
    }
    return { decision, locale };
  }

  /**
   * Après l'envoi : un cas limite est signalé à la modération (avec le message, que l'équipe voit dans son contexte
   * immédiat) ; une hésitation passe à l'IA en arrière-plan si les deux ont accepté la lecture par l'IA.
   */
  async afterMessage(input: { userId: string; linkId: string; text: string; screened: ScreenedMessage; written: readonly MessageRecord[] }): Promise<void> {
    const mine = input.written.find((m) => m.authorKind === 'user' && m.authorId === input.userId && m.kind === 'text');
    const { decision, locale } = input.screened;
    if (decision.outcome === 'flag') {
      await this.desk.file({ reporter: null, targetUser: input.userId, linkId: input.linkId, messageId: mine?.id ?? null, reason: reasonOf(decision.category), details: null, source: 'filter', category: decision.category });
      return;
    }
    if (decision.outcome !== 'review' || !mine) return;
    const rows = await this.chatSettings.forLink(input.linkId);
    const link = await this.links.findById(input.linkId);
    if (!link) return;
    const of = (u: string) => rows.find((r) => r.userId === u)?.consent ?? null;
    if (!chatReadingAllowed(of(link.userA), of(link.userB))) return;
    this.background.run('modération par l’IA', async () => {
      const result = await this.ai.complete({ feature: 'moderation', userId: input.userId, system: moderationSystem, prompt: moderationPrompt(input.text), maxTokens: 4, tier: 'small', locale });
      if (!result.ok) return; // passerelle coupée, budget, panne : la règle (envoyé) reste
      const parsed = parseAiModeration(result.text);
      if (!parsed?.category) return;
      await this.desk.file({ reporter: null, targetUser: input.userId, linkId: input.linkId, messageId: mine.id, reason: reasonOf(parsed.category), details: 'Signalé par l’IA de modération.', source: 'filter', category: parsed.category });
    });
  }
}
