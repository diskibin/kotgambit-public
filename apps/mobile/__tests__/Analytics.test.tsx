import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import App from '../App';
import { makeStore } from '../src/app/store';
import { resetTracker, setAnalyticsEnabled } from '../src/features/analytics/tracker';
import { useTrack } from '../src/features/analytics/useTrack';
import { PremiumNudge } from '../src/features/premium/PremiumNudge';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { HOME, SIGNED_IN } from '../src/test/fixtures';
import { mockApi } from '../src/test/mockApi';

interface Sent {
  visitorId: string;
  name: string;
  source: string;
  detail?: string;
}

let sent: Sent[];

const events = {
  'POST /analytics/events': async (request: Request) => {
    sent.push((await request.json()) as Sent);
    return new Response(null, { status: 204 });
  },
};

beforeEach(() => {
  sent = [];
  resetTracker();
  setAnalyticsEnabled(true);
});

afterEach(() => setAnalyticsEnabled(false));

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={makeStore()}>{children}</Provider>
);

describe('counting the steps of the app', () => {
  it('reports the opening and the sign-in once, marked as the app, with one id', async () => {
    mockApi({ ...SIGNED_IN, ...HOME, ...events });
    render(<App store={makeStore()} />);
    await waitFor(() =>
      expect(sent.map((event) => event.name).sort()).toEqual(['signed_in', 'visit']),
    );
    expect(sent.every((event) => event.source === 'app')).toBe(true);
    expect(new Set(sent.map((event) => event.visitorId)).size).toBe(1);
    expect(sent[0]?.visitorId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('counts a step done again once per launch, and a hint once for each kind', async () => {
    mockApi({ ...events });
    const { result } = renderHook(() => useTrack(), { wrapper });
    await act(async () => {
      result.current('premium_view', { oncePerLaunch: true });
      result.current('premium_view', { oncePerLaunch: true });
      result.current('nudge_view', { oncePerLaunch: true, detail: 'puzzles-limit' });
      result.current('nudge_view', { oncePerLaunch: true, detail: 'cards-limit' });
      result.current('checkout_start');
      result.current('checkout_start');
    });
    await waitFor(() => expect(sent).toHaveLength(5));
    expect(sent.map((event) => `${event.name}:${event.detail ?? ''}`)).toEqual([
      'premium_view:',
      'nudge_view:puzzles-limit',
      'nudge_view:cards-limit',
      'checkout_start:',
      'checkout_start:',
    ]);
  });

  it('keeps the same id for the next launch', async () => {
    mockApi({ ...events });
    const first = renderHook(() => useTrack(), { wrapper });
    await act(async () => first.result.current('visit'));
    await waitFor(() => expect(sent).toHaveLength(1));
    first.unmount();

    // A new launch forgets what it held in memory, the Keychain still has the id
    resetTracker();
    const second = renderHook(() => useTrack(), { wrapper });
    await act(async () => second.result.current('visit'));
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]?.visitorId).toBe(sent[0]?.visitorId);
  });

  it('sends nothing while counting is off', async () => {
    setAnalyticsEnabled(false);
    mockApi({ ...events });
    const { result } = renderHook(() => useTrack(), { wrapper });
    await act(async () => result.current('visit'));
    expect(sent).toHaveLength(0);
  });

  it('reports the hint that was seen and the press on its button', async () => {
    mockApi({ ...events });
    const onPremium = jest.fn();
    render(
      <Provider store={makeStore()}>
        <ThemeProvider preference="light">
          <PremiumNudge kind="puzzles" onPremium={onPremium} />
        </ThemeProvider>
      </Provider>,
    );
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ name: 'nudge_view', detail: 'puzzles-limit', source: 'app' });

    fireEvent.press(screen.getByRole('button'));
    expect(onPremium).toHaveBeenCalled();
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]).toMatchObject({ name: 'nudge_click', detail: 'puzzles-limit' });
  });
});
