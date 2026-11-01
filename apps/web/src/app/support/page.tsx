import type { Metadata } from 'next';
import { LegalDocument, LegalLayout } from '@blowy/ui-web';
import { SUPPORT, LEGAL_UPDATED } from '../../content/legal';
import { PublicFooter } from '../../components/public';

export const metadata: Metadata = { title: 'Aide et signalement' };

export default function Page() {
  return (
    <LegalLayout footer={<PublicFooter />}>
      <LegalDocument title="Aide et signalement" updated={LEGAL_UPDATED} sections={SUPPORT} />
    </LegalLayout>
  );
}
