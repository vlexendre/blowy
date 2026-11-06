/**
 * Page ange gardien (`/ange/<jeton>`, spec-v5 §2.9, V5.1 G.21, V5.3 A.4) — pour un·e proche SANS
 * compte ni app. Rendu serveur uniquement à partir de `GET /v1/public/guardian/:token` :
 *  - ce qui est montré : prénom de la personne, date et heure, lieu (dès la veille 18 h), chronologie
 *    (« arrivé·e », « tout va bien », alerte, terminé), numéros d'urgence ;
 *  - jamais : autres participants, chat, fiabilité, position (même en alerte : lieu + heure seulement) ;
 *  - aucun traceur, aucun cookie (exclu du proxy), `no-store`, `noindex`, `Referrer-Policy: no-referrer`.
 * Jeton inconnu, expiré, révoqué : la même page « lien plus valable » (404).
 */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { GuardianPageViewSchema, GuardianTokenSchema, type GuardianPageView } from '@blowy/api-contract';
import { publicApi } from '../../../lib/api';
import { WEB_PUSH_PUBLIC_KEY } from '../../../lib/config';
import { PushOptIn } from './push-opt-in';
import s from './ange.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ange gardien', robots: { index: false, follow: false, nocache: true }, referrer: 'no-referrer' };

const TZ = 'Europe/Paris';
const time = (iso: string) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
const hm = (iso: string) => time(iso).replace(':', ' h ');
const day = (iso: string) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
const sameDay = (a: Date, b: Date) => day(a.toISOString()) === day(b.toISOString());

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5l3.2 3L13 4.5" stroke="#16110D" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function stepLabel(e: GuardianPageView['timeline'][number], name: string) {
  switch (e.type) {
    case 'CHECKED_IN':
      return `${time(e.at)} · ${name} est arrivé·e`;
    case 'OK':
      return `${time(e.at)} · « Tout va bien »`;
    case 'ALERT':
      return `${time(e.at)} · Demande d’aide`;
    default:
      return `${time(e.at)} · Terminé`;
  }
}

function Emergency({ onAlert }: { onAlert: boolean }) {
  return (
    <div className={s.actions}>
      <a className={`${s.btn} ${onAlert ? s.btnWhite : s.btnDark}`} href="tel:17">
        Appeler le 17
      </a>
      <a className={`${s.btn} ${onAlert ? s.btnDark : s.btnLight}`} href="tel:112">
        Urgence : 112
      </a>
    </div>
  );
}

function AlertView({ v }: { v: GuardianPageView }) {
  const name = v.ownerFirstName || 'La personne';
  return (
    <main className={`${s.page} ${s.alert}`}>
      <div className={s.alertHead}>
        <span className={s.alertIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l10 18H2z" fill="#D92D2D" />
            <path d="M12 10v5M12 18h.01" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </span>
        <span className={`${s.display} ${s.h1}`} style={{ textTransform: 'none' }}>
          {time(v.alert!.at)}
        </span>
      </div>
      <h1 className={`${s.display} ${s.h1}`}>{name} a besoin d’aide.</h1>
      <p className={s.lead}>Appelle {name} tout de suite avec ton téléphone. Sans réponse, appelle le 17.</p>
      <section className={s.card} aria-label="Lieu de la sortie">
        <span className={s.lbl}>Lieu de la sortie · {hm(v.startsAt)}</span>
        {v.venue ? (
          <>
            <span className={`${s.display} ${s.venue}`}>{v.venue.name}</span>
            <p className={s.meta}>À lire au 17 : « {v.venue.name}, {v.venue.address}. »</p>
          </>
        ) : (
          <p className={s.meta}>Le lieu n’est pas encore communiqué.</p>
        )}
        <p className={s.note}>L’équipe Blowy a reçu la demande et la traite en priorité. Le personnel du lieu n’intervient pas à ta place.</p>
      </section>
      <Emergency onAlert />
    </main>
  );
}

export default async function AngePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!GuardianTokenSchema.safeParse(token).success) notFound();
  const h = await headers();
  const r = await publicApi<unknown>('GET', `/v1/public/guardian/${token}`, { forwardedFor: h.get('x-forwarded-for') });
  if (!r.ok && r.status === 404) notFound();
  const parsed = r.ok ? GuardianPageViewSchema.safeParse(r.data) : null;
  if (!parsed?.success) {
    return (
      <main className={s.page}>
        <h1 className={`${s.display} ${s.h1}`}>Page momentanément indisponible.</h1>
        <p className={s.note}>Réessaie dans un instant. En cas d’urgence, n’attends pas : appelle le 17 ou le 112.</p>
        <Emergency onAlert={false} />
      </main>
    );
  }
  const v = parsed.data;
  if (v.alert) return <AlertView v={v} />;
  const name = v.ownerFirstName || 'La personne';
  const now = new Date();
  const tonight = sameDay(new Date(v.startsAt), now);
  const hasOk = v.timeline.some((e) => e.type === 'OK');
  const ended = v.timeline.some((e) => e.type === 'ENDED');
  return (
    <main className={s.page}>
      {v.active && !ended ? <meta httpEquiv="refresh" content="60" /> : null}
      <div className={s.intro}>
        <img className={s.mascot} src="/ange/raton-telephone.webp" alt="" aria-hidden="true" width={84} height={84} />
        <span>
          {name} t’a choisi·e comme ange gardien{tonight ? ' pour ce soir' : ''}. Pas besoin d’app.
        </span>
      </div>
      <h1 className={`${s.display} ${s.h1}`}>
        Tu veilles sur {name}
        {tonight ? ' ce soir' : ''}.
      </h1>
      <section className={s.card} aria-label="Sortie">
        {v.venue ? <span className={`${s.display} ${s.venue}`}>{v.venue.name}</span> : <span className={`${s.display} ${s.venue}`}>Lieu communiqué la veille à 18 h</span>}
        <p className={s.meta}>
          {v.venue ? `${v.venue.address} · ` : ''}
          {day(v.startsAt)}, {hm(v.startsAt)} – {hm(v.endsAt)} · {v.kind === 'OUTING' ? 'sortie de groupe, lieu public' : 'rendez-vous à deux, lieu public'}
        </p>
        {v.active || v.timeline.length ? (
          <>
            <hr className={s.sep} />
            <ol className={s.timeline} aria-label="Chronologie">
              {v.timeline.map((e) => (
                <li key={`${e.type}-${e.at}`} className={s.step}>
                  <span className={`${s.dot} ${e.type === 'ALERT' ? s.dotAlert : ''}`}>{e.type === 'ALERT' ? null : <Check />}</span>
                  {stepLabel(e, name)}
                </li>
              ))}
              {v.active && !hasOk && !ended ? (
                <li className={`${s.step} ${s.stepPending}`}>
                  <span className={s.pending} aria-hidden="true" />
                  {hm(v.endsAt)} · « Tout va bien » attendu
                </li>
              ) : null}
            </ol>
          </>
        ) : (
          <p className={s.note}>Rendez-vous prévu le {day(v.startsAt)} à {hm(v.startsAt)}. La page s’animera deux heures avant.</p>
        )}
        <p className={s.note}>Si {name} demande de l’aide, cette page passe au rouge et l’équipe Blowy est prévenue en priorité.</p>
      </section>
      {WEB_PUSH_PUBLIC_KEY ? <PushOptIn token={token} publicKey={WEB_PUSH_PUBLIC_KEY} /> : null}
      <Emergency onAlert={false} />
      {v.expiresAt ? (
        <p className={s.small}>
          Lien privé, expire le {day(v.expiresAt)} à {hm(v.expiresAt)}.{' '}
          <a className={s.link} href="/support">
            Ce lien ne m’est pas destiné
          </a>
        </p>
      ) : null}
      <a className={s.promo} href="/">
        <img src="/ange/raton-salut.webp" alt="" aria-hidden="true" width={40} height={40} />
        <span>blowy. : une sortie à 5, chaque semaine, dans un lieu public.</span>
        <span className={s.promoCta}>Voir ›</span>
      </a>
    </main>
  );
}
