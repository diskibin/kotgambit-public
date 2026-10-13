import * as Keychain from 'react-native-keychain';

// The id is not secret, but Keychain is the one native store the app already has, so it rides on it
const SERVICE = 'kotgambit.visitor';
const USERNAME = 'visitor';

// The tests turn it off (jest.setup.js): a request that nobody expects is an error there
let enabled = true;

export function analyticsEnabled(): boolean {
  return enabled;
}

export function setAnalyticsEnabled(value: boolean): void {
  enabled = value;
}

/** A random version 4 id. It only has to differ between installs, nobody can be found by it. */
function randomId(): string {
  const hex = (count: number) =>
    Array.from({ length: count }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const variant = (8 + Math.floor(Math.random() * 4)).toString(16);
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${variant}${hex(3)}-${hex(12)}`;
}

let known: Promise<string | null> | null = null;

/**
 * The random id of this install. It is made up here and says nothing about the person; when the Keychain
 * fails there is no id and the step is not counted. One promise, so that two steps at the start of the app
 * cannot make up two ids.
 */
export function visitorId(): Promise<string | null> {
  known ??= (async () => {
    try {
      const stored = await Keychain.getGenericPassword({ service: SERVICE });
      if (stored) return stored.password;
      const id = randomId();
      await Keychain.setGenericPassword(USERNAME, id, { service: SERVICE });
      return id;
    } catch {
      return null;
    }
  })();
  return known;
}

/** Forgets the id held in memory, for the tests: a new test starts as a new install. */
export function resetTracker(): void {
  known = null;
  sent.clear();
}

const sent = new Set<string>();

/** True the first time since the app started, so that a step done again and again counts once per launch. */
export function firstInLaunch(name: string): boolean {
  if (sent.has(name)) return false;
  sent.add(name);
  return true;
}
