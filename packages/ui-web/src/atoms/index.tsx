/** Atomes : aucun import d'un niveau supérieur. Composants serveur (sans état). */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export type ButtonVariant = 'primary' | 'secondary' | 'ink' | 'lime' | 'danger' | 'ghost';
interface ButtonStyle {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  block?: boolean;
}
const btnClass = ({ variant = 'primary', size = 'md', block }: ButtonStyle, extra?: string) => cx('bw-btn', `bw-btn--${variant}`, size === 'sm' && 'bw-btn--sm', block && 'bw-btn--block', extra);

export function Button({ variant, size, block, className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle) {
  return <button type={type} className={btnClass({ variant, size, block }, className)} {...rest} />;
}

export function ButtonLink({ variant, size, block, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & ButtonStyle) {
  return <a className={btnClass({ variant, size, block }, className)} {...rest} />;
}

export type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx('bw-badge', tone !== 'neutral' && `bw-badge--${tone}`)}>{children}</span>;
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('bw-input', className)} {...rest} />;
}
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx('bw-select', className)} {...rest}>
      {children}
    </select>
  );
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('bw-textarea', className)} {...rest} />;
}

export function Heading({ level = 1, display, children, id }: { level?: 1 | 2 | 3; display?: boolean; children: ReactNode; id?: string }) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return (
    <Tag id={id} className={cx(display !== false && 'bw-display', `bw-h${level}`)}>
      {children}
    </Tag>
  );
}

export function Text({ muted, small, children, as = 'p' }: { muted?: boolean; small?: boolean; children: ReactNode; as?: 'p' | 'span' | 'div' }) {
  const Tag = as;
  return <Tag className={cx(muted && 'bw-text-muted', small && 'bw-small')} style={as === 'p' ? { margin: 0 } : undefined}>{children}</Tag>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="bw-label">{children}</span>;
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="bw-code">{children}</code>;
}

export function Pre({ value }: { value: unknown }) {
  return <pre className="bw-pre">{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</pre>;
}

export function Spinner({ label = 'Chargement' }: { label?: string }) {
  return (
    <span role="status" aria-live="polite">
      <span className="bw-spinner" aria-hidden="true" />
      <span className="bw-sr">{label}</span>
    </span>
  );
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="bw-sr">{children}</span>;
}

/** Image de sprite légère (webp statique, dimensions fixées : pas de décalage de mise en page). */
export function Sprite({ src, alt, size = 108, priority }: { src: string; alt: string; size?: number; priority?: boolean }) {
  return <img src={src} alt={alt} width={size} height={size} decoding="async" fetchPriority={priority ? 'high' : 'auto'} loading={priority ? 'eager' : 'lazy'} style={{ objectFit: 'contain' }} />;
}

export function Card({ children, as = 'section', labelledBy }: { children: ReactNode; as?: 'section' | 'div' | 'article'; labelledBy?: string }) {
  const Tag = as;
  return <Tag className="bw-card" aria-labelledby={labelledBy}>{children}</Tag>;
}
