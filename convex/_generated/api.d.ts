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
import type * as contacts from "../contacts.js";
import type * as followUpRecommendations from "../followUpRecommendations.js";
import type * as helpers from "../helpers.js";
import type * as importHistory from "../importHistory.js";
import type * as integrations from "../integrations.js";
import type * as organizations from "../organizations.js";
import type * as outreach from "../outreach.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activityLog: typeof activityLog;
  calendarEvents: typeof calendarEvents;
  contacts: typeof contacts;
  followUpRecommendations: typeof followUpRecommendations;
  helpers: typeof helpers;
  importHistory: typeof importHistory;
  integrations: typeof integrations;
  organizations: typeof organizations;
  outreach: typeof outreach;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
