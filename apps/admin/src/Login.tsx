import { type FormEvent, useState } from 'react';
import { AuthFailure, LOCAL_CODE, type Session, auth } from './auth';
import { config } from './config';

export function Login({ onSignedIn, denied }: { onSignedIn: (s: Session) => void; denied: string | null }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (step === 'email') {
        await auth.sendCode(email);
        setStep('code');
      } else {
        onSignedIn(await auth.verify(email, code));
      }
    } catch (err) {
      setError(err instanceof AuthFailure ? err.message : 'Connexion impossible pour le moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <form onSubmit={submit} className="card" style={{ padding: 32 }} aria-labelledby="t">
        <p className="brand">
          Blowy<small>Administration</small>
        </p>
        <h1 id="t" style={{ fontSize: 26 }}>
          Connexion
        </h1>
        {denied && (
          <p className="notice bad" role="alert">
            {denied}
          </p>
        )}
        {step === 'email' ? (
          <label className="field">
            Adresse e-mail de l’équipe
            <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </label>
        ) : (
          <label className="field">
            Code reçu à {email}
            <input className="input" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            {config.auth === 'local' && <span className="muted small">Mode local : le code est {LOCAL_CODE}.</span>}
          </label>
        )}
        {error && (
          <p className="notice bad" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn primary" disabled={busy}>
          {step === 'email' ? 'Recevoir un code' : 'Se connecter'}
        </button>
        {step === 'code' && (
          <button type="button" className="btn link" onClick={() => setStep('email')}>
            Changer d’adresse
          </button>
        )}
        <p className="muted small" style={{ margin: 0 }}>
          Accès réservé aux adresses autorisées par l’API.
        </p>
      </form>
    </main>
  );
}
