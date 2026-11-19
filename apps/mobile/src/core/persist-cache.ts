/**
 * Cache gardé entre deux lancements : à l'ouverture, l'accueil, la liste des chats, les derniers messages, les groupes
 * et les rencontres s'affichent tout de suite avec les dernières données connues, puis sont relus (elles sont datées :
 * jamais « fraîches » au réveil). Rien d'autre n'est gardé : seulement ces clés, seulement la page la plus récente
 * d'un fil, quelques fils, pour la même personne, pour le même build, moins de 3 jours.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type DehydratedState, dehydrate, hydrate, type Query, type QueryClient } from '@tanstack/react-query';

const KEY = 'blowy.query-cache';
const MAX_AGE_MS = 3 * 24 * 3_600_000;
/** Fils de messages gardés (les plus récemment lus). */
const MAX_THREADS = 8;
const SAVE_EVERY_MS = 2_000;

interface Saved {
  userId: string;
  build: string;
  savedAt: number;
  state: DehydratedState;
}

/** Clés gardées : ce qui fait les premiers écrans (accueil, chats, un chat, groupes, rencontres). */
export function keepQuery(key: readonly unknown[]): 'whole' | 'thread' | null {
  const [a, b, c] = key;
  if (key.length === 1 && (a === 'me' || a === 'pet' || a === 'links' || a === 'groups' || a === 'encounters')) return 'whole';
  if (a === 'rituals' && key.length === 2 && (b === 'today' || b === 'streak')) return 'whole';
  if ((a === 'links' || a === 'groups') && key.length === 2 && typeof b === 'string') return 'whole';
  if ((a === 'links' || a === 'groups') && key.length === 3 && c === 'messages') return 'thread';
  return null;
}

/** Un fil de messages gardé : sa page la plus récente seulement (les plus anciennes se relisent en remontant). */
export function firstPageOnly(data: unknown): unknown {
  if (!data || typeof data !== 'object' || !('pages' in data) || !('pageParams' in data)) return data;
  const d = data as { pages: unknown[]; pageParams: unknown[] };
  return { pages: d.pages.slice(0, 1), pageParams: d.pageParams.slice(0, 1) };
}

/** L'état à garder : clés retenues, réussies, fils les plus récents, première page de chacun. */
export function snapshot(qc: QueryClient): DehydratedState {
  const threads = new Set(
    qc
      .getQueryCache()
      .findAll({ predicate: (q) => keepQuery(q.queryKey) === 'thread' && q.state.status === 'success' })
      .sort((x, y) => y.state.dataUpdatedAt - x.state.dataUpdatedAt)
      .slice(0, MAX_THREADS)
      .map((q) => q.queryHash),
  );
  const state = dehydrate(qc, {
    shouldDehydrateQuery: (q: Query) => {
      if (q.state.status !== 'success') return false;
      const kind = keepQuery(q.queryKey);
      return kind === 'whole' || (kind === 'thread' && threads.has(q.queryHash));
    },
  });
  return {
    ...state,
    queries: state.queries.map((q) => (keepQuery(q.queryKey) === 'thread' ? { ...q, state: { ...q.state, data: firstPageOnly(q.state.data) } } : q)),
  };
}

/** Remet les dernières données connues de cette personne (même build, pas trop vieilles). Sans effet sinon. */
export async function restoreCache(qc: QueryClient, userId: string, build: string, now = Date.now()): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Saved;
    if (saved.userId !== userId || saved.build !== build || now - saved.savedAt > MAX_AGE_MS) {
      await AsyncStorage.removeItem(KEY);
      return;
    }
    // `hydrate` ne remplace jamais une donnée plus récente déjà en cache.
    hydrate(qc, saved.state);
  } catch {
    await AsyncStorage.removeItem(KEY).catch(() => undefined);
  }
}

/** Garde le cache au fil des changements (regroupés), jusqu'à l'appel de la fonction rendue. */
export function keepCache(qc: QueryClient, userId: string, build: string): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    timer = null;
    const saved: Saved = { userId, build, savedAt: Date.now(), state: snapshot(qc) };
    void AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => undefined);
  };
  const off = qc.getQueryCache().subscribe((e) => {
    if (e.type !== 'updated' || e.action.type !== 'success' || !keepQuery(e.query.queryKey)) return;
    timer ??= setTimeout(save, SAVE_EVERY_MS);
  });
  return () => {
    off();
    if (timer) clearTimeout(timer);
  };
}

/** Déconnexion, suppression du compte : plus rien de gardé. */
export const forgetCache = (): Promise<void> => AsyncStorage.removeItem(KEY).catch(() => undefined);
