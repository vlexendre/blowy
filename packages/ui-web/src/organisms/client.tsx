'use client';
/**
 * Organismes interactifs (seul JS client du design system) :
 *  - ActionForm : soumission d'une mutation (server action), état en cours, retour (succès/erreur),
 *    demande de step-up MFA inline si l'API l'exige ;
 *  - WordPicker : limite visuelle à 3 mots (le serveur reste l'autorité ; sans JS, le formulaire
 *    fonctionne et la validation serveur s'applique).
 */
import { useActionState, useState, type ReactNode } from 'react';
import { Button, Input } from '../atoms/index';
import { Field, Notice, WordChip } from '../molecules/index';

export interface ActionState {
  status: 'idle' | 'ok' | 'error' | 'stepup';
  message: string;
  requestId?: string;
}
export const IDLE: ActionState = { status: 'idle', message: '' };

export function ActionForm({
  action,
  children,
  submitLabel,
  variant = 'primary',
  inline,
  confirm,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children?: ReactNode;
  submitLabel: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ink' | 'lime';
  inline?: boolean;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  return (
    <form
      action={formAction}
      className={inline ? 'bw-form bw-form--inline' : 'bw-form'}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {state.status === 'stepup' ? (
        <Field label="Code MFA (réauthentification)" htmlFor="stepup-code" hint="Action sensible : saisis un nouveau code de ton application.">
          <Input id="stepup-code" name="_stepup" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required autoFocus />
        </Field>
      ) : null}
      <div>
        <Button type="submit" variant={variant} size={inline ? 'sm' : 'md'} disabled={pending} aria-busy={pending}>
          {pending ? 'En cours…' : submitLabel}
        </Button>
      </div>
      <div aria-live="polite">
        {state.status === 'ok' ? <Notice tone="ok">{state.message}</Notice> : null}
        {state.status === 'error' ? (
          <Notice tone="error">
            {state.message}
            {state.requestId ? ` (réf. ${state.requestId})` : ''}
          </Notice>
        ) : null}
        {state.status === 'stepup' ? <Notice tone="warn">{state.message}</Notice> : null}
      </div>
    </form>
  );
}

export function WordPicker({ name, words, max = 3, legend }: { name: string; words: { id: string; label: string }[]; max?: number; legend: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <fieldset className="bw-words" onChange={(e) => {
      const t = e.target as unknown as HTMLInputElement;
      if (t.type !== 'checkbox') return;
      setSelected((s) => (t.checked ? [...s, t.value] : s.filter((x) => x !== t.value)));
    }}>
      <legend className="bw-sr">{legend}</legend>
      {words.map((w) => (
        <WordChip key={w.id} id={`w-${w.id}`} name={name} value={w.id} label={w.label} disabled={selected.length >= max && !selected.includes(w.id)} />
      ))}
      <p className="bw-small" aria-live="polite" style={{ width: '100%', margin: '6px 0 0', color: '#bdb2a6', fontWeight: 700 }}>
        {selected.length} / {max} · que des mots gentils, c’est la règle
      </p>
    </fieldset>
  );
}
