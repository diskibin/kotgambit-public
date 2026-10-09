import { CLIENT_HEADER, MOBILE_CLIENT } from '@kotgambit/contracts';
import {
  createBaseQuery,
  endpoints,
  REDUCER_PATH,
  TAG_TYPES,
  type SessionAdapter,
} from '@kotgambit/api-client';
import { createApi } from '@reduxjs/toolkit/query/react';
import { getRefreshToken, saveRefreshToken } from './refreshTokenStorage';

// The app talks to the production server even in debug builds, so a device or emulator needs no
// local API. To try a local one, use http://10.0.2.2:3000 (how the emulator reaches the host).
export const API_URL = 'https://api.kotgambit.ru';

// The site, where the documents (the offer and the privacy policy) are read.
export const WEB_URL = 'https://kotgambit.ru';

/**
 * The api is created before the store, but the session lives in the store.
 * `makeStore` fills in these functions, they are only called when a request runs.
 */
export const sessionBridge: Pick<
  SessionAdapter,
  'getAccessToken' | 'setAccessToken' | 'onSessionExpired'
> = {
  getAccessToken: () => null,
  setAccessToken: () => undefined,
  onSessionExpired: () => undefined,
};

const session: SessionAdapter = {
  getAccessToken: () => sessionBridge.getAccessToken(),
  setAccessToken: (token) => sessionBridge.setAccessToken(token),
  getRefreshToken,
  setRefreshToken: saveRefreshToken,
  onSessionExpired: () => sessionBridge.onSessionExpired(),
};

export const api = createApi({
  reducerPath: REDUCER_PATH,
  // The marker header makes the API return the refresh token in the body, there are no cookies here
  baseQuery: createBaseQuery({
    baseUrl: API_URL,
    session,
    headers: { [CLIENT_HEADER]: MOBILE_CLIENT },
  }),
  tagTypes: TAG_TYPES,
  endpoints,
});

export const {
  useActiveGameQuery,
  useDeleteAccountMutation,
  useSettingsQuery,
  useSetAccessoryMutation,
  useUpdateSettingsMutation,
  useCancelSubscriptionMutation,
  useCheckoutMutation,
  useEntitlementsQuery,
  useExchangeOAuthCodeMutation,
  useIdentitiesQuery,
  useLinkIdentityMutation,
  useOauthProvidersQuery,
  useStartLinkingProviderMutation,
  useUnlinkIdentityMutation,
  usePaymentQuery,
  usePlansQuery,
  useResumeSubscriptionMutation,
  useSubscriptionQuery,
  useAnswerCardMutation,
  useCardSummaryQuery,
  useMakeCardsMutation,
  useNextCardMutation,
  useProfileQuery,
  useAnalyzePositionMutation,
  useBotsQuery,
  useCreateGameMutation,
  useGameBotMoveMutation,
  useGameHintMutation,
  useGameMoveMutation,
  useGameQuery,
  useGameResignMutation,
  useGameUndoMutation,
  useLazyGameQuery,
  useCompleteLessonMutation,
  useDailyPuzzleQuery,
  useForgotPasswordMutation,
  useHealthQuery,
  useLessonQuery,
  useLessonsQuery,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useNextPuzzleMutation,
  useProgressQuery,
  usePuzzleGiveUpMutation,
  usePuzzleHintMutation,
  usePuzzleMoveMutation,
  usePuzzleStatsQuery,
  usePuzzleThemesQuery,
  useRegisterMutation,
  useResendVerificationMutation,
  useResetPasswordMutation,
  useReviewQuery,
  useStartReviewMutation,
  useVerifyEmailMutation,
} = api;
