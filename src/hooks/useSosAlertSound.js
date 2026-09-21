import { useEffect, useState } from 'react';
import {
  ensureSosSoundBridge,
  getSosSoundState,
  stopSosAlertSound,
  subscribeSosSound,
  syncSosAlertSound,
} from '@/utils/sosAlertSound';

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

  useEffect(() => {
    ensureSosSoundBridge();
    return subscribeSosSound(setState);
  }, []);

  useEffect(() => {
    ensureSosSoundBridge();
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
