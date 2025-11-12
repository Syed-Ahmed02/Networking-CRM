import {
  runApolloPeopleSearch,
  type ApolloPeopleSearchResult,
} from './apolloAgent';
import { PeopleSearchSchema, type PeopleSearchResult } from '../types';

export interface PeopleSearchInput {
  companyName: string;
  role?: string;
  numResults?: number;
  includeCompanyInfo?: boolean;
}

/**
 * Search for people at a specific company via Apollo.
 *
 * 1. Calls the Apollo mixed_people/search endpoint through the shared tool
 * 2. Normalises the response to the Convex-compatible PeopleSearch schema
 * 3. Optionally attempts to include company domain information
 *
 * @param input - People search parameters
 * @returns Structured people search results
 */
export async function searchPeople(
  input: PeopleSearchInput
): Promise<PeopleSearchResult> {
  const {
    companyName,
    role,
    numResults = 10,
    includeCompanyInfo = false,
  } = input;

  try {
    const searchResponse = await runApolloPeopleSearch({
      personTitles: role ? [role] : undefined,
      includeSimilarTitles: true,
      qKeywords: companyName,
      perPage: Math.min(numResults, 200),
      page: 1,
    });

    type ApolloContact = ApolloPeopleSearchResult['contacts'][number];

    const contacts = (searchResponse.contacts ?? []).filter(
      (contact: ApolloContact) => typeof contact.name === 'string' && contact.name.trim().length > 0
    );

    const people = contacts.map((contact: ApolloContact) => {
      const nameParts = contact.name?.trim().split(/\s+/) ?? [];
      const [firstName, ...lastParts] = nameParts;
      const lastName = lastParts.length ? lastParts.join(' ') : undefined;

      return {
        name: contact.name,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        company: contact.organizationName ?? companyName,
        role: contact.title ?? '',
        headline: contact.headline ?? undefined,
        linkedinUrl: contact.linkedinUrl ?? undefined,
        location: contact.location
          ? {
              city: contact.location,
            }
          : undefined,
        emails: contact.email
          ? [
              {
                email: contact.email,
                isPrimary: true,
                position: 0,
              },
            ]
          : undefined,
      };
    });

    const limitedPeople = people.slice(0, numResults);

    const domainBreadcrumb = searchResponse.breadcrumbs?.find(
      (breadcrumb: any) => breadcrumb?.signal_field_name === 'q_organization_domains_list'
    );
    const domainValue = Array.isArray(domainBreadcrumb?.value)
      ? domainBreadcrumb.value[0]
      : typeof domainBreadcrumb?.value === 'string'
        ? domainBreadcrumb.value
        : undefined;

    const result = {
      people: limitedPeople,
      companyInfo:
        includeCompanyInfo && domainValue
          ? {
              name: companyName,
              domain: domainValue,
              websiteUrl: `https://${domainValue}`,
              linkedinUrl: undefined,
              industry: undefined,
            }
          : undefined,
      totalFound:
        searchResponse.pagination?.total_entries ??
        searchResponse.pagination?.totalEntries ??
        contacts.length,
    };

    return PeopleSearchSchema.parse(result);
  } catch (error) {
    console.error('People search error:', error);
    throw new Error(`Failed to search for people: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search for specific roles at a company
 * 
 * @param companyName - Company to search
 * @param roles - Array of roles to search for (e.g., ["CEO", "CTO", "VP Marketing"])
 * @returns Combined results for all roles
 */
export async function searchPeopleByRoles(
  companyName: string,
  roles: string[]
): Promise<PeopleSearchResult> {
  const results = await Promise.allSettled(
    roles.map(role =>
      searchPeople({
        companyName,
        role,
        numResults: 5,
        includeCompanyInfo: false,
      })
    )
  );

  const successfulResults = results
    .filter((result): result is PromiseFulfilledResult<PeopleSearchResult> =>
      result.status === 'fulfilled'
    )
    .map(result => result.value);

  // Combine all people, removing duplicates by LinkedIn URL
  const allPeople = successfulResults.flatMap(r => r.people);
  const uniquePeople = Array.from(
    new Map(
      allPeople
        .filter(p => p.linkedinUrl)
        .map(p => [p.linkedinUrl, p])
    ).values()
  );

  // Add people without LinkedIn URLs
  const peopleWithoutLinkedIn = allPeople.filter(p => !p.linkedinUrl);
  uniquePeople.push(...peopleWithoutLinkedIn);

  return {
    people: uniquePeople,
    companyInfo: successfulResults[0]?.companyInfo,
    totalFound: uniquePeople.length,
  };
}

/**
 * Search for decision makers at a company (executives and leadership)
 * 
 * @param companyName - Company to search
 * @returns People in leadership positions
 */
export async function searchDecisionMakers(
  companyName: string
): Promise<PeopleSearchResult> {
  const leadershipRoles = [
    'CEO',
    'CTO',
    'CFO',
    'COO',
    'CMO',
    'VP',
    'Vice President',
    'Director',
    'Head of',
    'Founder',
  ];

  return searchPeopleByRoles(companyName, leadershipRoles);
}
