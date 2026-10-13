import type { AnalyticsEventName, NudgeKind } from '@kotgambit/contracts';
import { useCallback } from 'react';
import { useTrackEventMutation } from '../../app/api';
import { analyticsEnabled, firstInLaunch, visitorId } from './tracker';

interface TrackOptions {
  /** Count it once since the app started, however many times it happens. */
  oncePerLaunch?: boolean;
  /** Which hint about Premium, for the two events about hints. */
  detail?: NudgeKind;
}

/** Reports a step of the visitor, as the site does. Never waits, never fails loudly: counting must not get in the way. */
export function useTrack(): (name: AnalyticsEventName, options?: TrackOptions) => void {
  const [send] = useTrackEventMutation();
  return useCallback(
    (name, options) => {
      if (!analyticsEnabled()) return;
      // A step with a detail is counted once for each detail: seeing two hints is two steps
      const key = options?.detail ? `${name}.${options.detail}` : name;
      if (options?.oncePerLaunch && !firstInLaunch(key)) return;
      void visitorId().then((id) => {
        if (!id) return;
        void send({
          visitorId: id,
          name,
          source: 'app',
          ...(options?.detail ? { detail: options.detail } : {}),
        });
      });
    },
    [send],
  );
}
