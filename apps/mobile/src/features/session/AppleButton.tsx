/** Bouton « Continuer avec Apple » hors iPhone (développement, web) : dessiné par le kit. Sur iPhone : `AppleButton.ios.tsx`. */
import { AuthButton } from '@blowy/ui';

export interface AppleButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

export function AppleButton({ label, onPress, loading }: AppleButtonProps) {
  return <AuthButton provider="apple" label={label} onPress={onPress} loading={loading} />;
}
