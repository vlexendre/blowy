/**
 * Inscription « Ouvre ton quartier » reprise (minimoa://quartier/CODE, lien de l'e-mail d'ouverture) : sans compte
 * prêt, le code est gardé dans le brouillon et part avec l'inscription (le compte reprend l'inscription, et l'objet
 * de fondateur s'il a été gagné) ; avec un compte, l'accueil.
 */
import { isSignupCode } from '@blowy/domain';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { resumeOnboarding, signedOutStart, useDraft } from '@/features/onboarding';
import { useGate } from '@/features/session';

export default function QuartierLink() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = (params.code ?? '').trim().toUpperCase();
  const gate = useGate();
  const [kept, setKept] = useState(false);
  const fresh = gate === 'signedOut' || gate === 'needsOnboarding';

  useEffect(() => {
    if (!fresh || kept) return;
    const d = useDraft.getState();
    if (isSignupCode(code) && (!d.inviteCode || d.codeKind === 'quartier')) d.set({ inviteCode: code, codeKind: 'quartier' });
    setKept(true);
  }, [fresh, kept, code]);

  if (gate === 'loading') return null;
  if (fresh) return kept ? <Redirect href={gate === 'signedOut' ? signedOutStart() : resumeOnboarding()} /> : null;
  return <Redirect href="/" />;
}
