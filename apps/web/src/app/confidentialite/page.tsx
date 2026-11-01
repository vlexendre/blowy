import type { Metadata } from 'next';
import { LegalDocument, LegalLayout } from '@blowy/ui-web';
import { PRIVACY, LEGAL_UPDATED } from '../../content/legal';
import { PublicFooter } from '../../components/public';

export const metadata: Metadata = { title: 'Confidentialité' };

export default function Page() {
  return (
    <LegalLayout footer={<PublicFooter />}>
      <LegalDocument title="Confidentialité" updated={LEGAL_UPDATED} sections={PRIVACY} />
    </LegalLayout>
  );
}
