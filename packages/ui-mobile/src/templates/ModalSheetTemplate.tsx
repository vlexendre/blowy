import type { ReactNode } from 'react';
import { Text } from '../atoms/Text';
import { Header } from '../molecules/Header';
import { ScreenFrame } from './ScreenFrame';

export interface ModalSheetTemplateProps {
  title: string;
  lead?: string;
  onClose: () => void;
  closeLabel: string;
  footer?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
  testID?: string;
}

/** Écran présenté en modale (route expo-router `presentation: 'modal'`) : fermer en haut. */
export function ModalSheetTemplate({ title, lead, onClose, closeLabel, footer, banner, children, testID }: ModalSheetTemplateProps) {
  return (
    <ScreenFrame footer={footer} banner={banner} testID={testID}>
      <Header title={title} onClose={onClose} closeLabel={closeLabel} />
      {lead ? (
        <Text variant="body" tone="inkSoft">
          {lead}
        </Text>
      ) : null}
      {children}
    </ScreenFrame>
  );
}
