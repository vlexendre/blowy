/** Page « Ouvre ton quartier » : formulaire, quartier ouvert, confirmation, désinscription (voir pages/quartier). */
import { ZONE_ID_RE, isSignupCode } from '@blowy/domain';
import { api } from '../lib/api';
import { DEEP_LINK_SCHEME } from '../config/site';
import { bindCopy, withRef } from './ref';
import { showState } from './public-page';
import { mountQuartierForm, renderCounter, showInvite } from './quartier-form';
import { growthCopy } from '../content/growth';
import { locale } from './quiz-shared';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);
const params = new URLSearchParams(window.location.search);
const parts = window.location.pathname.split('/').filter(Boolean);
const seg = parts[parts.indexOf('quartier') + 1] ?? params.get('a') ?? params.get('z') ?? '';
const token = params.get('t');

async function load(): Promise<void> {
  if ((seg === 'confirmer' || seg === 'desinscription') && token) {
    showState('loading', false);
    try {
      if (seg === 'desinscription') {
        await api.quartiers.unsubscribe(token);
        return showState('unsubscribed');
      }
      const r = await api.quartiers.confirm(token);
      const root = $('[data-qp-confirmed]');
      if (root) {
        renderCounter(root, r.status);
        showInvite(root, r.status, r.code);
      }
      return showState('confirmed');
    } catch {
      return showState('link_failed');
    }
  }
  const zone = ZONE_ID_RE.test(seg) ? seg : null;
  const ref = params.get('ref');
  const code = params.get('code');
  if (zone) {
    try {
      const s = await api.quartiers.status(zone);
      if (s.open) {
        const z = $('[data-qp-zone]');
        if (z) z.textContent = s.label;
        if (code && isSignupCode(code)) {
          const box = $('[data-code-box="quartier"]');
          const out = box?.querySelector<HTMLElement>('[data-code]');
          if (box && out) {
            out.textContent = code.toUpperCase();
            box.hidden = false;
            bindCopy('quartier', code.toUpperCase(), growthCopy[locale]);
          }
        }
        const open = $<HTMLAnchorElement>('[data-qp-open]');
        if (open) open.href = withRef(`${DEEP_LINK_SCHEME}quartier/${code && isSignupCode(code) ? code.toUpperCase() : ''}`);
        return showState('open', false);
      }
    } catch {
      // Quartier inconnu ou pas de réseau : le formulaire, sans quartier choisi.
    }
  }
  const form = $('[data-quartier-form]');
  if (form) mountQuartierForm(form, { zone, ref });
  showState('form', false);
}

void load();
