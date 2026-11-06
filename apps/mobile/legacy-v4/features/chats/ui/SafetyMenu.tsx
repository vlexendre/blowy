/**
 * Menu de sécurité d'une conversation (feuille modale) : signaler, bloquer (confirmation
 * lisible, sans message de départ), partir proprement, pause, aide 17 (hors API).
 */
import { Banner, Button, ListRow, Sheet, space } from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { paths } from '../../../core/navigation/paths';
import { t } from '../../../i18n';
import { callEmergency } from '../../trust';

export interface SafetyMenuProps {
  visible: boolean;
  onClose: () => void;
  otherName: string;
  conversationId: string | null;
  relationshipId: string | null;
  onBlock: () => void;
}

export function SafetyMenu({ visible, onClose, otherName, conversationId, relationshipId, onBlock }: SafetyMenuProps) {
  const [confirm, setConfirm] = useState(false);
  const go = (href: Parameters<typeof router.push>[0]) => {
    onClose();
    router.push(href);
  };
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t('common.close')} title={t('chat.menu')} testID="chat-menu-sheet">
      <ListRow icon="flag" title={t('chat.report')} onPress={() => go({ pathname: paths.profileScreen('report'), params: { conversationId: conversationId ?? '', relationshipId: relationshipId ?? '' } })} testID="menu-report" />
      <ListRow icon="shield" title={t('chat.block')} destructive onPress={() => setConfirm(true)} testID="menu-block" />
      {confirm ? (
        <View style={{ gap: space.sm }}>
          <Banner message={t('chat.blockConfirm', { name: otherName })} tone="danger" />
          <Button
            label={t('chat.block')}
            variant="danger"
            onPress={() => {
              onBlock();
              setConfirm(false);
              onClose();
            }}
            testID="confirm-block"
          />
        </View>
      ) : null}
      {relationshipId ? <ListRow icon="back" title={t('chat.leave')} onPress={() => go(paths.relation(relationshipId, 'leave'))} /> : null}
      {relationshipId ? <ListRow icon="pause" title={t('chat.pause')} onPress={() => go(paths.relation(relationshipId, 'pause'))} /> : null}
      <ListRow icon="phone" title={t('common.help')} subtitle={t('common.helpHint')} destructive onPress={() => void callEmergency()} testID="menu-help" />
    </Sheet>
  );
}
