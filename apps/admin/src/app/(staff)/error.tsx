'use client';
import { Button, StatusState } from '@blowy/ui-web';

export default function SectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <StatusState kind="error" detail="Une erreur inattendue est survenue." requestId={error.digest} action={<Button variant="secondary" size="sm" onClick={reset}>Réessayer</Button>} />;
}
