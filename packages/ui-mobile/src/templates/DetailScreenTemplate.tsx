import type { ReactNode } from 'react';
import { Text } from '../atoms/Text';
import { Header } from '../molecules/Header';
import { ScreenFrame } from './ScreenFrame';

export interface DetailScreenTemplateProps {
  title: string;
  eyebrow?: string;
  lead?: string;
  onBack: () => void;
  backLabel: string;
  trailing?: ReactNode;
  banner?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  testID?: string;
}

/** Écran poussé dans une pile : en-tête retour + contenu + pied optionnel. */
export function DetailScreenTemplate({
  title,
  eyebrow,
  lead,
  onBack,
  backLabel,
  trailing,
  banner,
  footer,
  children,
  scroll = true,
  testID,
}: DetailScreenTemplateProps) {
  return (
    <ScreenFrame banner={banner} footer={footer} scroll={scroll} testID={testID}>
      <Header
        title={title}
        eyebrow={eyebrow}
        onBack={onBack}
        backLabel={backLabel}
        trailing={trailing}
      />
      {lead ? (
        <Text variant="body" tone="inkSoft">
          {lead}
        </Text>
      ) : null}
      {children}
    </ScreenFrame>
  );
}
