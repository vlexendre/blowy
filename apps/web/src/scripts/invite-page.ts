/** Page d'invitation : charge l'invitation, propose d'ouvrir l'app (blowy://i/CODE) ou de l'installer. */
import { api, failureOf } from '../lib/api';
import { readCode } from '../lib/code';
import { setPetImage } from '../lib/pet';
import { DEEP_LINK_SCHEME } from '../config/site';
import { common, fill, invitePage as c } from '../content/public';
import { fillTemplates, onRetry, showState } from './public-page';

const code = readCode('i');
const errorText = document.querySelector<HTMLElement>('[data-state="error"] .pub-text');

async function load(): Promise<void> {
  if (!code) return showState('not_found', false);
  showState('loading', false);
  try {
    const invite = await api.invites.get(code);
    const v = { name: invite.displayName, pet: invite.pet.name };
    fillTemplates(v);
    const img = document.querySelector<HTMLImageElement>('[data-pet]');
    if (img) setPetImage(img, invite.pet.species, invite.pet.mood === 'neutre' ? 'salut' : invite.pet.mood, fill(c.petAlt, v));
    const open = document.querySelector<HTMLAnchorElement>('[data-open]');
    if (open) open.href = `${DEEP_LINK_SCHEME}i/${encodeURIComponent(code)}`;
    const out = document.querySelector<HTMLElement>('[data-code]');
    if (out) out.textContent = code;
    showState('ready');
  } catch (e) {
    const kind = failureOf(e);
    if (kind === 'not_found') return showState('not_found');
    if (errorText) errorText.textContent = kind === 'network' ? common.networkText : kind === 'rate_limited' ? common.busyText : common.genericText;
    showState('error');
  }
}

document.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget as HTMLButtonElement;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    btn.textContent = c.copied;
    window.setTimeout(() => (btn.textContent = c.copy), 2000);
  } catch {
    const out = document.querySelector<HTMLElement>('[data-code]');
    if (out) window.getSelection()?.selectAllChildren(out);
  }
});

onRetry(() => void load());
void load();
