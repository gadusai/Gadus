import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { GadusChatStreamInput, GadusConversation, GadusConversationInput, GadusMessage, GadusMessageInput, GadusMode, GadusPrompt, GadusStudioAsset, GadusSummary, HealthStatus, ListGadusStudioAssetsParams } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetGadusSummaryUrl: () => string;
/**
 * @summary Get the personalized Gadus dashboard summary
 */
export declare const getGadusSummary: (options?: Parameters<typeof customFetch>[1]) => Promise<GadusSummary>;
export declare const getGetGadusSummaryQueryKey: () => readonly ["/api/gadus/summary"];
export declare const getGetGadusSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getGadusSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGadusSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGadusSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGadusSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getGadusSummary>>>;
export type GetGadusSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get the personalized Gadus dashboard summary
 */
export declare function useGetGadusSummary<TData = Awaited<ReturnType<typeof getGadusSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGadusSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListGadusModesUrl: () => string;
/**
 * @summary List Gadus assistant modes
 */
export declare const listGadusModes: (options?: Parameters<typeof customFetch>[1]) => Promise<GadusMode[]>;
export declare const getListGadusModesQueryKey: () => readonly ["/api/gadus/modes"];
export declare const getListGadusModesQueryOptions: <TData = Awaited<ReturnType<typeof listGadusModes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusModes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGadusModes>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGadusModesQueryResult = NonNullable<Awaited<ReturnType<typeof listGadusModes>>>;
export type ListGadusModesQueryError = ErrorType<unknown>;
/**
 * @summary List Gadus assistant modes
 */
export declare function useListGadusModes<TData = Awaited<ReturnType<typeof listGadusModes>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusModes>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListGadusConversationsUrl: () => string;
/**
 * @summary List recent Gadus conversations
 */
export declare const listGadusConversations: (options?: Parameters<typeof customFetch>[1]) => Promise<GadusConversation[]>;
export declare const getListGadusConversationsQueryKey: () => readonly ["/api/gadus/conversations"];
export declare const getListGadusConversationsQueryOptions: <TData = Awaited<ReturnType<typeof listGadusConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGadusConversations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGadusConversationsQueryResult = NonNullable<Awaited<ReturnType<typeof listGadusConversations>>>;
export type ListGadusConversationsQueryError = ErrorType<unknown>;
/**
 * @summary List recent Gadus conversations
 */
export declare function useListGadusConversations<TData = Awaited<ReturnType<typeof listGadusConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateGadusConversationUrl: () => string;
/**
 * @summary Create a Gadus conversation
 */
export declare const createGadusConversation: (gadusConversationInput: GadusConversationInput, options?: Parameters<typeof customFetch>[1]) => Promise<GadusConversation>;
export declare const getCreateGadusConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGadusConversation>>, TError, {
        data: BodyType<GadusConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createGadusConversation>>, TError, {
    data: BodyType<GadusConversationInput>;
}, TContext>;
export type CreateGadusConversationMutationResult = NonNullable<Awaited<ReturnType<typeof createGadusConversation>>>;
export type CreateGadusConversationMutationBody = BodyType<GadusConversationInput>;
export type CreateGadusConversationMutationError = ErrorType<unknown>;
/**
* @summary Create a Gadus conversation
*/
export declare const useCreateGadusConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGadusConversation>>, TError, {
        data: BodyType<GadusConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createGadusConversation>>, TError, {
    data: BodyType<GadusConversationInput>;
}, TContext>;
export declare const getListGadusMessagesUrl: (conversationId: number) => string;
/**
 * @summary List messages in a Gadus conversation
 */
export declare const listGadusMessages: (conversationId: number, options?: Parameters<typeof customFetch>[1]) => Promise<GadusMessage[]>;
export declare const getListGadusMessagesQueryKey: (conversationId: number) => readonly [`/api/gadus/conversations/${number}/messages`];
export declare const getListGadusMessagesQueryOptions: <TData = Awaited<ReturnType<typeof listGadusMessages>>, TError = ErrorType<unknown>>(conversationId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGadusMessages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGadusMessagesQueryResult = NonNullable<Awaited<ReturnType<typeof listGadusMessages>>>;
export type ListGadusMessagesQueryError = ErrorType<unknown>;
/**
 * @summary List messages in a Gadus conversation
 */
export declare function useListGadusMessages<TData = Awaited<ReturnType<typeof listGadusMessages>>, TError = ErrorType<unknown>>(conversationId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateGadusMessageUrl: (conversationId: number) => string;
/**
 * @summary Add a message to a Gadus conversation
 */
export declare const createGadusMessage: (conversationId: number, gadusMessageInput: GadusMessageInput, options?: Parameters<typeof customFetch>[1]) => Promise<GadusMessage>;
export declare const getCreateGadusMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGadusMessage>>, TError, {
        conversationId: number;
        data: BodyType<GadusMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createGadusMessage>>, TError, {
    conversationId: number;
    data: BodyType<GadusMessageInput>;
}, TContext>;
export type CreateGadusMessageMutationResult = NonNullable<Awaited<ReturnType<typeof createGadusMessage>>>;
export type CreateGadusMessageMutationBody = BodyType<GadusMessageInput>;
export type CreateGadusMessageMutationError = ErrorType<unknown>;
/**
* @summary Add a message to a Gadus conversation
*/
export declare const useCreateGadusMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createGadusMessage>>, TError, {
        conversationId: number;
        data: BodyType<GadusMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createGadusMessage>>, TError, {
    conversationId: number;
    data: BodyType<GadusMessageInput>;
}, TContext>;
export declare const getStreamGadusChatUrl: () => string;
/**
 * @summary Stream a Gadus response
 */
export declare const streamGadusChat: (gadusChatStreamInput: GadusChatStreamInput, options?: Parameters<typeof customFetch>[1]) => Promise<string>;
export declare const getStreamGadusChatMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof streamGadusChat>>, TError, {
        data: BodyType<GadusChatStreamInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof streamGadusChat>>, TError, {
    data: BodyType<GadusChatStreamInput>;
}, TContext>;
export type StreamGadusChatMutationResult = NonNullable<Awaited<ReturnType<typeof streamGadusChat>>>;
export type StreamGadusChatMutationBody = BodyType<GadusChatStreamInput>;
export type StreamGadusChatMutationError = ErrorType<unknown>;
/**
* @summary Stream a Gadus response
*/
export declare const useStreamGadusChat: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof streamGadusChat>>, TError, {
        data: BodyType<GadusChatStreamInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof streamGadusChat>>, TError, {
    data: BodyType<GadusChatStreamInput>;
}, TContext>;
export declare const getListGadusPromptsUrl: () => string;
/**
 * @summary List the Gadus prompt library
 */
export declare const listGadusPrompts: (options?: Parameters<typeof customFetch>[1]) => Promise<GadusPrompt[]>;
export declare const getListGadusPromptsQueryKey: () => readonly ["/api/gadus/prompts"];
export declare const getListGadusPromptsQueryOptions: <TData = Awaited<ReturnType<typeof listGadusPrompts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusPrompts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGadusPrompts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGadusPromptsQueryResult = NonNullable<Awaited<ReturnType<typeof listGadusPrompts>>>;
export type ListGadusPromptsQueryError = ErrorType<unknown>;
/**
 * @summary List the Gadus prompt library
 */
export declare function useListGadusPrompts<TData = Awaited<ReturnType<typeof listGadusPrompts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusPrompts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListGadusStudioAssetsUrl: (params?: ListGadusStudioAssetsParams) => string;
/**
 * @summary List generated Gadus studio assets
 */
export declare const listGadusStudioAssets: (params?: ListGadusStudioAssetsParams, options?: Parameters<typeof customFetch>[1]) => Promise<GadusStudioAsset[]>;
export declare const getListGadusStudioAssetsQueryKey: (params?: ListGadusStudioAssetsParams) => readonly ["/api/gadus/studio/assets", ...ListGadusStudioAssetsParams[]];
export declare const getListGadusStudioAssetsQueryOptions: <TData = Awaited<ReturnType<typeof listGadusStudioAssets>>, TError = ErrorType<unknown>>(params?: ListGadusStudioAssetsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusStudioAssets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listGadusStudioAssets>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListGadusStudioAssetsQueryResult = NonNullable<Awaited<ReturnType<typeof listGadusStudioAssets>>>;
export type ListGadusStudioAssetsQueryError = ErrorType<unknown>;
/**
 * @summary List generated Gadus studio assets
 */
export declare function useListGadusStudioAssets<TData = Awaited<ReturnType<typeof listGadusStudioAssets>>, TError = ErrorType<unknown>>(params?: ListGadusStudioAssetsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listGadusStudioAssets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map