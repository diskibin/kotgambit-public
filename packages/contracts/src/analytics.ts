import { z } from 'zod';

/** The steps of a visitor that the site and the app report. Signing up and paying are read from the database, not reported. */
export const AnalyticsEventNameSchema = z.enum([
  'visit',
  'signed_in',
  'premium_view',
  'checkout_start',
  'nudge_view',
  'nudge_click',
]);
export type AnalyticsEventName = z.infer<typeof AnalyticsEventNameSchema>;

/** Which hint about Premium was shown: a limit that was reached, or a warning that it is near. */
export const NUDGE_KINDS = [
  'puzzles-limit',
  'puzzles-soft',
  'analysis-limit',
  'analysis-soft',
  'cards-limit',
] as const;
export const NudgeKindSchema = z.enum(NUDGE_KINDS);
export type NudgeKind = z.infer<typeof NudgeKindSchema>;

/** Where the step happened. The site left it out before the app existed, so a missing one means the site. */
export const ANALYTICS_SOURCES = ['web', 'app'] as const;
export const AnalyticsSourceSchema = z.enum(ANALYTICS_SOURCES);
export type AnalyticsSource = z.infer<typeof AnalyticsSourceSchema>;

export const AnalyticsEventRequestSchema = z
  .object({
    /** A random id the browser or the app made up and keeps, it says nothing about who the visitor is. */
    visitorId: z.uuid(),
    name: AnalyticsEventNameSchema,
    source: AnalyticsSourceSchema.default('web'),
    /** Which hint, for the two events about hints and no other. */
    detail: NudgeKindSchema.optional(),
  })
  .refine((event) => event.name.startsWith('nudge_') === (event.detail !== undefined), {
    message: 'detail goes with the events about hints only',
  });
/** What a client sends: the site leaves the source out. */
export type AnalyticsEventRequest = z.input<typeof AnalyticsEventRequestSchema>;
/** What the server reads, with the source filled in. */
export type AnalyticsEvent = z.output<typeof AnalyticsEventRequestSchema>;

export const STATS_PERIOD_DAYS = [7, 30, 90] as const;
export const StatsPeriodSchema = z.coerce
  .number()
  .int()
  .refine((days): days is (typeof STATS_PERIOD_DAYS)[number] =>
    (STATS_PERIOD_DAYS as readonly number[]).includes(days),
  );

export const DEFAULT_STATS_DAYS = 30;
/** The `days` of the stats request, the default period when it is left out. */
export const StatsQuerySchema = StatsPeriodSchema.default(DEFAULT_STATS_DAYS);

const Count = z.number().int().nonnegative();

const FunnelSchema = z.object({
  visitors: Count,
  signedIn: Count,
  premiumView: Count,
  checkoutStart: Count,
  /** Learners whose first payment from this client went through. */
  paid: Count,
});

export const AdminStatsSchema = z.object({
  days: z.number().int().positive(),
  /** Distinct visitors that reached each step of the funnel of the site in the period. */
  funnel: FunnelSchema,
  /** The same steps counted in the app. */
  appFunnel: FunnelSchema,
  /** One entry per day of the period, oldest first, UTC days as `YYYY-MM-DD`. */
  daily: z.array(
    z.object({
      day: z.string(),
      /** Distinct visitors of the site and of the app together. */
      visitors: Count,
      registrations: Count,
      payments: Count,
      revenueKopecks: Count,
    }),
  ),
  users: z.object({
    total: Count,
    registered: Count,
    /** Learners with activity today, in the last 7 days and in the last 30 days. */
    dau: Count,
    wau: Count,
    mau: Count,
  }),
  premium: z.object({
    active: Count,
    month: Count,
    year: Count,
    autoRenew: Count,
    /** Cancelled but still inside the paid period. */
    canceledPaid: Count,
    newInPeriod: Count,
    renewalsInPeriod: Count,
    failedPayments: Count,
    revenueKopecks: Count,
    totalRevenueKopecks: Count,
  }),
  /** The hints about Premium on the site and in the app together: distinct visitors who saw each and pressed it. */
  nudges: z.array(z.object({ kind: NudgeKindSchema, viewed: Count, clicked: Count })),
  usage: z.object({
    gamesStarted: Count,
    gamesFinished: Count,
    puzzlesStarted: Count,
    puzzlesSolved: Count,
    lessonsCompleted: Count,
    reviewsDone: Count,
  }),
});
export type AdminStats = z.infer<typeof AdminStatsSchema>;
