'use client';
/**
 * « Me prévenir sur ce téléphone » : abonnement Web Push optionnel, souscrit DEPUIS la page du proche.
 * Notifications sans contenu (texte neutre affiché par /ange-sw.js). Aucune donnée personnelle n'est
 * demandée ni stockée côté Blowy (seul l'endpoint du navigateur, purgé 24 h après l'expiration du lien).
 */
import { useState } from 'react';
import s from './ange.module.css';

const key = (b64u: string) => {
  const raw = atob(b64u.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64u.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export function PushOptIn({ token, publicKey }: { token: string; publicKey: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'on' | 'denied' | 'unsupported' | 'error'>('idle');
  async function enable() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return setState('unsupported');
    setState('busy');
    try {
      const reg = await navigator.serviceWorker.register('/ange-sw.js', { scope: `/ange/${token}` });
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setState('denied');
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key(publicKey) });
      const res = await fetch(`/ange/${token}/push`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subscription: { endpoint: sub.endpoint } }) });
      setState(res.ok ? 'on' : 'error');
    } catch {
      setState('error');
    }
  }
  const msg = { on: 'Notifications activées sur ce téléphone.', denied: 'Notifications refusées dans le navigateur.', unsupported: 'Ce navigateur ne permet pas les notifications.', error: 'Activation impossible pour le moment.' } as const;
  return state === 'idle' || state === 'busy' ? (
    <button type="button" className={`${s.btn} ${s.btnLight}`} onClick={enable} disabled={state === 'busy'}>
      Me prévenir sur ce téléphone
    </button>
  ) : (
    <p className={s.small} role="status">
      {msg[state]}
    </p>
  );
}
