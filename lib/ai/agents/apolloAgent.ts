import { tool } from 'ai';
import { z } from 'zod';

/**
 * Apollo People Search Tool
 *
 * Wraps the Apollo mixed_people/search endpoint for use with the Vercel AI SDK.
 * The tool can be invoked directly or supplied to an agent/generateObject call.
 */
const executeApolloPeopleSearch = async (input: {
  personTitles?: string[];
  includeSimilarTitles: boolean;
  qKeywords?: string;
  personLocations?: string[];
  personSeniorities?: Array<
    | 'owner'
    | 'founder'
    | 'c_suite'
    | 'partner'
    | 'vp'
    | 'head'
    | 'director'
    | 'manager'
    | 'senior'
    | 'entry'
    | 'intern'
  >;
  organizationLocations?: string[];
  organizationDomains?: string[];
  page: number;
  perPage: number;
}) => {
  const {
    personTitles,
    includeSimilarTitles,
    qKeywords,
    personLocations,
    personSeniorities,
    organizationLocations,
    organizationDomains,
    page,
    perPage,
  } = input;

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new Error('APOLLO_API_KEY is not set.');
  }

  const payload: Record<string, unknown> = {
    api_key: apiKey,
    include_similar_titles: includeSimilarTitles,
    page,
    per_page: perPage,
  };

  if (personTitles?.length) {
    payload.person_titles = personTitles;
  }
  if (qKeywords) {
    payload.q_keywords = qKeywords;
  }
  if (personLocations?.length) {
    payload.person_locations = personLocations;
  }
  if (personSeniorities?.length) {
    payload.person_seniorities = personSeniorities;
  }
  if (organizationLocations?.length) {
    payload.organization_locations = organizationLocations;
  }
  if (organizationDomains?.length) {
    payload.q_organization_domains_list = organizationDomains;
  }

  const response = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      "X-Api-Key": process.env.APOLLO_API_KEY || '',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Apollo API request failed: ${response.status} ${errorText || response.statusText}`,
    );
  }

  const data = await response.json();

  return {
    pagination: data.pagination,
    breadcrumbs: data.breadcrumbs,
    contacts: Array.isArray(data.contacts)
      ? data.contacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          title: contact.title,
          organizationName: contact.organization_name,
          organizationId: contact.organization_id,
          headline: contact.headline,
          email: contact.email,
          emailStatus: contact.email_status,
          linkedinUrl: contact.linkedin_url,
          location: contact.present_raw_address,
          seniority: contact.person_seniority,
        }))
      : [],
  };
};

export const apolloPeopleSearchTool = tool({
  description:
    'Search Apollo for people by job title, seniority, location, and company filters.',
  inputSchema: z.object({
    personTitles: z
      .array(z.string())
      .optional()
      .describe('Job titles to match (Apollo person_titles[]).'),
    includeSimilarTitles: z
      .boolean()
      .default(true)
      .describe('Include similar titles (Apollo include_similar_titles).'),
    qKeywords: z
      .string()
      .optional()
      .describe('Free-text keywords to filter results (Apollo q_keywords).'),
    personLocations: z
      .array(z.string())
      .optional()
      .describe('Person home locations (Apollo person_locations[]).'),
    personSeniorities: z
      .array(
        z.enum([
          'owner',
          'founder',
          'c_suite',
          'partner',
          'vp',
          'head',
          'director',
          'manager',
          'senior',
          'entry',
          'intern',
        ])
      )
      .optional()
      .describe('Current job seniorities (Apollo person_seniorities[]).'),
    organizationLocations: z
      .array(z.string())
      .optional()
      .describe('Company headquarters locations (Apollo organization_locations[]).'),
    organizationDomains: z
      .array(z.string())
      .optional()
      .describe('Company domains (Apollo q_organization_domains_list[]).'),
    page: z
      .number()
      .int()
      .min(1)
      .default(1)
      .describe('Page number.'),
    perPage: z
      .number()
      .int()
      .min(1)
      .max(200)
      .default(25)
      .describe('Results per page.'),
  }),
  execute: executeApolloPeopleSearch,
});

export const runApolloPeopleSearch = executeApolloPeopleSearch;

export type ApolloPeopleSearchInput = Parameters<typeof runApolloPeopleSearch>[0];

export type ApolloPeopleSearchResult = Awaited<
  ReturnType<typeof runApolloPeopleSearch>
>;