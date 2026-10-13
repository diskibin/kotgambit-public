import { useEffect } from 'react';
import { useAppSelector } from '../../app/hooks';
import { useTrack } from './useTrack';

/** Counts the opening of the app and the sign-in, once each per launch, like the site does per visit. */
export function AppAnalytics() {
  const track = useTrack();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    track('visit', { oncePerLaunch: true });
  }, [track]);

  useEffect(() => {
    if (status === 'authenticated') track('signed_in', { oncePerLaunch: true });
  }, [status, track]);

  return null;
}
