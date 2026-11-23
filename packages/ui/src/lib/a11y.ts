import { type ComponentRef, useEffect, useRef } from 'react';
import { AccessibilityInfo, type View } from 'react-native';

/**
 * Place le focus de VoiceOver sur une vue (le titre d'un écran) quand `active` devient vrai. Le délai laisse finir
 * la transition d'écran, sans quoi iOS garde le focus où il était.
 */
export function useAccessibilityFocus(active = true, delay = 500) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      if (ref.current) AccessibilityInfo.sendAccessibilityEvent(ref.current, 'focus');
    }, delay);
    return () => clearTimeout(timer);
  }, [active, delay]);
  return ref;
}
