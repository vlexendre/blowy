/** Champs de formulaire admin récurrents (motif obligatoire, montant…). */
import { Field, Input, Select, Textarea } from '@blowy/ui-web';

export function ReasonField({ id = 'reason', label = 'Motif (obligatoire, audité)' }: { id?: string; label?: string }) {
  return (
    <Field label={label} htmlFor={id} hint="5 caractères minimum. Visible dans l’audit.">
      <Input id={id} name="f.reason" required minLength={5} maxLength={500} />
    </Field>
  );
}

export function SelectField({ id, name, label, options, required }: { id: string; name: string; label: string; options: [string, string][]; required?: boolean }) {
  return (
    <Field label={label} htmlFor={id}>
      <Select id={id} name={name} required={required}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function TextField({ id, name, label, hint, required, type = 'text', defaultValue, pattern, inputMode }: { id: string; name: string; label: string; hint?: string; required?: boolean; type?: string; defaultValue?: string | number; pattern?: string; inputMode?: 'numeric' | 'text' }) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Input id={id} name={name} type={type} required={required} defaultValue={defaultValue} pattern={pattern} inputMode={inputMode} aria-describedby={hint ? `${id}-hint` : undefined} />
    </Field>
  );
}

export function JsonField({ id, name, label, defaultValue, rows = 12, hint }: { id: string; name: string; label: string; defaultValue: string; rows?: number; hint?: string }) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Textarea id={id} name={name} rows={rows} defaultValue={defaultValue} spellCheck={false} />
    </Field>
  );
}
