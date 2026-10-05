import { useEffect, useState } from 'react';
import {
  getSosSoundState,
  stopSosAlertSound,
  subscribeSosSound,
  syncSosAlertSound,
} from '@/modules/guard/utils/sosAlertSound';

/**
 * Keep SOS alarm looping while `activeAlerts` is non-empty.
 * Sound continues across route changes until Resolve or Stop.
 */
export function useSosAlertSound(activeAlerts = []) {
  const [state, setState] = useState(() => getSosSoundState());

  const activeKey = (activeAlerts || [])
    .map((a) => String(a?.id || '').trim())
    .filter(Boolean)
    .sort()
    .join('|');

  useEffect(() => subscribeSosSound(setState), []);

  useEffect(() => {
    syncSosAlertSound(activeAlerts);
    // Intentionally no cleanup stop — alarm must survive navigation
  }, [activeKey]); // eslint-disable-line react-hooks/exhaustive-deps -- key captures alert identity

  return {
    muted: state.muted,
    playing: state.playing,
    hasActive: state.hasActive || Boolean(activeKey),
    stop: stopSosAlertSound,
    mute: stopSosAlertSound,
  };
}
