import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** VoiceOver (ou TalkBack) allumé : l'onglet Quartier ouvre alors sa vue en liste, l'alternative à la carte. */
export function useScreenReader(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((v) => alive && setOn(v));
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return on;
}
