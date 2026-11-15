/**
 * Rituels (V7 §5 à §8) : la sortie du jour, le défi du jour, la série, les habitudes et leurs preuves, les souvenirs
 * privés et le bilan de la semaine. Les clés `ritualsToday` / `ritualsStreak` sont celles du pont des widgets
 * (`useWidgetSync`) : chaque réponse de l'API les met à jour, et le widget suit.
 */
import type { DailyChallenge, DailyResult, Habits, OutingAnswer, OutingResult, ProofResult, RitualsToday, Streak, WeeklyReview, WeeklyReviews } from '@blowy/contract';
import { itemById, STREAK_MILESTONES, streakReward } from '@blowy/domain';
import { type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

import { keys, useApi, usePorts } from '@/core';
import { useUnlocks } from '@/features/pet';

export { awayFromHome, useAwayFromHome } from './location';
export { type PlusReason, useOpenPlus } from './plus';

/** Clés propres aux écrans des rituels (l'accueil et la série gardent celles du cœur, partagées avec les widgets). */
export const ritualKeys = {
  habits: ['rituals', 'habits'] as const,
  catalogue: ['rituals', 'catalogue'] as const,
  memories: ['rituals', 'memories'] as const,
  reviews: ['rituals', 'reviews'] as const,
  review: (id: string) => ['rituals', 'review', id] as const,
  vision: ['vision', 'mine'] as const,
};

// ── Fête d'un défi relevé ─────────────────────────────────────────────────────

export interface StreakParty {
  streak: number;
  best: number;
  line: string | null;
}

/**
 * Défi tout juste relevé, à fêter sur l'accueil (le minimoa et sa mèche) : posé par toute réponse qui fait passer le
 * défi à « fait » (question, photo, sortie) ou par une relecture qui le découvre fait (défi « écrire », validé à
 * l'ouverture par le serveur).
 */
export const useStreakParty = create<{ party: StreakParty | null; push: (p: StreakParty) => void; clear: () => void }>((set) => ({
  party: null,
  push: (party) => set({ party }),
  clear: () => set({ party: null }),
}));

/** Objets gagnés par une action des rituels (palier de série, habitudes tenues) : fêtés par `UnlockCelebration`. */
function celebrateItems(ids: readonly string[]): void {
  const won = ids.filter((id) => itemById(id)?.unlock.kind !== 'start');
  if (won.length > 0) useUnlocks.getState().push(won);
}

const justDone = (before: DailyChallenge | undefined, after: DailyChallenge): boolean => after.status === 'done' && !!before && before.status !== 'done';

/** Range une réponse du défi ou de la sortie dans le cache de l'accueil, de la série (widgets) et fête ce qui doit l'être. */
function applyDaily(qc: QueryClient, result: (DailyResult | OutingResult) & { line?: string | null }): void {
  const before = qc.getQueryData<RitualsToday>(keys.ritualsToday);
  if (before) {
    const next: RitualsToday = { ...before, challenge: { ...result.challenge, present: false }, streak: result.streak };
    if ('outing' in result) {
      next.outing = result.outing;
      next.sociability = result.sociability;
      next.needsOut = result.outing.canAnswer && before.needsOut;
    }
    qc.setQueryData(keys.ritualsToday, next);
  }
  qc.setQueryData<Streak>(keys.ritualsStreak, result.streak);
  if (justDone(before?.challenge, result.challenge) || (!before && result.challenge.status === 'done')) {
    useStreakParty.getState().push({ streak: result.streak.current, best: result.streak.best, line: result.line ?? null });
  }
  celebrateItems(result.newItems);
  if (result.newItems.length > 0) void qc.invalidateQueries({ queryKey: keys.wardrobe });
  void qc.invalidateQueries({ queryKey: keys.pet });
}

// ── Lectures ──────────────────────────────────────────────────────────────────

/** Tout ce que l'accueil montre des rituels, en une requête. Découvre aussi un défi validé par le serveur à l'ouverture. */
export function useRitualsToday() {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.ritualsToday,
    queryFn: async () => {
      const before = qc.getQueryData<RitualsToday>(keys.ritualsToday);
      const today = await api.rituals.today();
      qc.setQueryData<Streak>(keys.ritualsStreak, today.streak);
      if (before && before.day === today.day && justDone(before.challenge, today.challenge)) {
        useStreakParty.getState().push({ streak: today.streak.current, best: today.streak.best, line: null });
      }
      return today;
    },
    staleTime: 30_000,
  });
}

/** La série seule (écran de la série), partagée avec le widget. */
export function useStreak() {
  const api = useApi();
  return useQuery({ queryKey: keys.ritualsStreak, queryFn: api.rituals.streak, staleTime: 30_000 });
}

/** Ta vision, pour l'instant (cinq axes, confiance, formulations). */
export function useVision() {
  const api = useApi();
  return useQuery({ queryKey: ritualKeys.vision, queryFn: api.vision.mine, staleTime: 5 * 60_000 });
}

// ── Sortie du jour ────────────────────────────────────────────────────────────

export function useOuting() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ answer, awayFromHome }: { answer: OutingAnswer; awayFromHome?: boolean }) => api.rituals.outing(answer, awayFromHome),
    onSuccess: (result) => applyDaily(qc, result),
  });
}

// ── Défi du jour ──────────────────────────────────────────────────────────────

/** La carte a été montrée (acceptée ou rangée) : elle ne remonte plus aujourd'hui. Silencieux en cas d'échec. */
export function useChallengeSeen() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.rituals.seenChallenge, onSuccess: (r) => applyDaily(qc, r) });
}

export function useAcceptChallenge() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.rituals.acceptChallenge, onSuccess: (r) => applyDaily(qc, r) });
}

export function useAnswerChallenge() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: (choice: 0 | 1) => api.rituals.answerChallenge(choice), onSuccess: (r) => applyDaily(qc, r) });
}

/** Défis « écrire » et « sortir » : le serveur vérifie que c'est fait. */
export function useCompleteChallenge() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.rituals.completeChallenge, onSuccess: (r) => applyDaily(qc, r) });
}

/** Une photo prise dans l'app (JPEG), prête à partir. */
export interface Shot {
  uri: string;
}

/** Photo du défi : ticket → envoi direct du fichier → validation. `keep` la garde dans les souvenirs privés. */
export function useChallengePhoto() {
  const api = useApi();
  const { media } = usePorts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ shot, keep }: { shot: Shot; keep: boolean }) => {
      const ticket = await api.rituals.challengePhotoTicket('image/jpeg');
      await media.upload(ticket, { uri: shot.uri, contentType: 'image/jpeg' });
      return api.rituals.challengePhoto(ticket.path, keep);
    },
    onSuccess: (r) => {
      applyDaily(qc, r);
      void qc.invalidateQueries({ queryKey: ritualKeys.memories });
    },
  });
}

// ── Habitudes ─────────────────────────────────────────────────────────────────

export function useHabits() {
  const api = useApi();
  return useQuery({ queryKey: ritualKeys.habits, queryFn: api.rituals.habits });
}

export function useHabitCatalogue() {
  const api = useApi();
  return useQuery({ queryKey: ritualKeys.catalogue, queryFn: api.rituals.habitCatalogue, staleTime: 10 * 60_000 });
}

function useHabitsMutation<V>(run: (v: V) => Promise<Habits>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (habits) => {
      qc.setQueryData(ritualKeys.habits, habits);
      void qc.invalidateQueries({ queryKey: ritualKeys.catalogue });
      void qc.invalidateQueries({ queryKey: keys.ritualsToday });
    },
  });
}

export function useAddHabit() {
  const api = useApi();
  return useHabitsMutation((body: Parameters<typeof api.rituals.addHabit>[0]) => api.rituals.addHabit(body));
}

export function useUpdateHabit() {
  const api = useApi();
  return useHabitsMutation(({ ref, ...body }: { ref: string } & Parameters<typeof api.rituals.updateHabit>[1]) => api.rituals.updateHabit(ref, body));
}

export function useRemoveHabit() {
  const api = useApi();
  return useHabitsMutation((ref: string) => api.rituals.removeHabit(ref));
}

/** Preuve d'une habitude : ticket → envoi → verdict (oui / non / pas sûr), phrase du minimoa. */
export function useProof(ref: string) {
  const api = useApi();
  const { media } = usePorts();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ shot, keep }: { shot: Shot; keep: boolean }): Promise<ProofResult> => {
      const ticket = await api.rituals.proofTicket(ref, 'image/jpeg');
      await media.upload(ticket, { uri: shot.uri, contentType: 'image/jpeg' });
      return api.rituals.proof(ref, ticket.path, keep);
    },
    onSuccess: (r) => {
      const before = qc.getQueryData<Habits>(ritualKeys.habits);
      if (before) qc.setQueryData<Habits>(ritualKeys.habits, { ...before, habits: before.habits.map((h) => (h.ref === r.habit.ref ? r.habit : h)) });
      celebrateItems(r.newItems);
      if (r.newItems.length > 0) void qc.invalidateQueries({ queryKey: keys.wardrobe });
      void qc.invalidateQueries({ queryKey: keys.ritualsToday });
      void qc.invalidateQueries({ queryKey: keys.pet });
      if (r.kept) void qc.invalidateQueries({ queryKey: ritualKeys.memories });
    },
  });
}

/** Garder (ou non) une photo dans les souvenirs privés. */
export function useKeepPhoto() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, keep }: { photoId: string; keep: boolean }) => api.rituals.keepPhoto(photoId, keep),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ritualKeys.memories }),
  });
}

export function usePrivateMemories() {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ritualKeys.memories,
    queryFn: ({ pageParam }) => api.rituals.memories(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextBefore,
  });
}

// ── Bilans ────────────────────────────────────────────────────────────────────

export function useReviews() {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ritualKeys.reviews,
    queryFn: ({ pageParam }) => api.rituals.reviews(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextBefore,
  });
}

export function useReview(id: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ritualKeys.review(id),
    queryFn: () => api.rituals.review(id),
    // Déjà dans la liste : affiché tout de suite, relu derrière.
    initialData: () => {
      const pages = qc.getQueryData<{ pages: WeeklyReviews[] }>(ritualKeys.reviews)?.pages ?? [];
      for (const p of pages) {
        const found = p.reviews.find((r) => r.id === id);
        if (found) return found;
      }
      return undefined;
    },
  });
}

/** Marque le bilan comme lu (il ne s'affiche plus sur l'accueil). */
export function useReadReview() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.rituals.readReview(id),
    onSuccess: (review: WeeklyReview) => {
      qc.setQueryData(ritualKeys.review(review.id), review);
      const today = qc.getQueryData<RitualsToday>(keys.ritualsToday);
      if (today?.unreadReviewId === review.id) qc.setQueryData<RitualsToday>(keys.ritualsToday, { ...today, unreadReviewId: null });
      void qc.invalidateQueries({ queryKey: ritualKeys.reviews });
    },
  });
}

/** Numéro de semaine ISO d'un lundi (« semaine 46 »). */
export function isoWeek(day: string): number {
  const d = new Date(`${day}T12:00:00Z`);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/**
 * Le prochain objet de série encore à gagner (palier au-delà du record, objet pas encore dans la garde-robe) et les
 * jours qu'il reste depuis la série en cours. Le `nextMilestone` du serveur suit la série en cours : après une série
 * retombée, son objet peut être déjà gagné.
 */
export function nextStreakItem(
  streak: Pick<Streak, 'current' | 'best'>,
  owned: (itemId: string) => boolean | undefined,
): { days: number; itemId: string; left: number } | null {
  for (const days of STREAK_MILESTONES) {
    const itemId = streakReward(days);
    if (!itemId) continue;
    const has = owned(itemId) ?? streak.best >= days;
    if (!has && days > streak.current) return { days, itemId, left: days - streak.current };
  }
  return null;
}
