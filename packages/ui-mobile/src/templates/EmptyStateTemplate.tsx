import type { ReactNode } from 'react';
import { Header } from '../molecules/Header';
import { EmptyState, type StateViewProps } from '../organisms/StateViews';
import { TAB_BAR_SPACE } from '../organisms/TabBar';
import { ScreenFrame } from './ScreenFrame';

export interface EmptyStateTemplateProps extends StateViewProps {
  onBack?: () => void;
  backLabel?: string;
  headerTitle?: string;
  banner?: ReactNode;
  /** Écran racine d'onglet (réserve la barre). */
  inTab?: boolean;
}

/** Écran entier en état vide / indisponible / erreur. */
export function EmptyStateTemplate({
  onBack,
  backLabel,
  headerTitle,
  banner,
  inTab,
  ...state
}: EmptyStateTemplateProps) {
  return (
    <ScreenFrame banner={banner} bottomSpace={inTab ? TAB_BAR_SPACE : 0}>
      {onBack && backLabel ? (
        <Header title={headerTitle} onBack={onBack} backLabel={backLabel} />
      ) : null}
      <EmptyState {...state} />
    </ScreenFrame>
  );
}
