/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLog from "../activityLog.js";
import type * as calendarEvents from "../calendarEvents.js";
import type * as chat from "../chat.js";
import type * as contacts from "../contacts.js";
import type * as followUpRecommendations from "../followUpRecommendations.js";
import type * as helpers from "../helpers.js";
import type * as importHistory from "../importHistory.js";
import type * as integrations from "../integrations.js";
import type * as organizations from "../organizations.js";
import type * as outreach from "../outreach.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLog: typeof activityLog;
  calendarEvents: typeof calendarEvents;
  chat: typeof chat;
  contacts: typeof contacts;
  followUpRecommendations: typeof followUpRecommendations;
  helpers: typeof helpers;
  importHistory: typeof importHistory;
  integrations: typeof integrations;
  organizations: typeof organizations;
  outreach: typeof outreach;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
