import type { Metadata } from 'next';
import { LegalDocument, LegalLayout } from '@blowy/ui-web';
import { TERMS, LEGAL_UPDATED } from '../../content/legal';
import { PublicFooter } from '../../components/public';

export const metadata: Metadata = { title: 'Conditions d’utilisation' };

export default function Page() {
  return (
    <LegalLayout footer={<PublicFooter />}>
      <LegalDocument title="Conditions d’utilisation" updated={LEGAL_UPDATED} sections={TERMS} />
    </LegalLayout>
  );
}
