/**
 * People Search Agent
 * Finds people at a specific company using Exa and AI
 */

import { generateText } from 'ai';
import { model } from '../config';
import { PeopleSearchSchema, type PeopleSearchResult } from '../types';
import {
  searchPeopleAtCompany,
  searchCompanyInfo,
  findCompanyDomain,
} from '../exa-helpers';

export interface PeopleSearchInput {
  companyName: string;
  role?: string;
  numResults?: number;
  includeCompanyInfo?: boolean;
}

/**
 * Search for people at a specific company
 * 
 * This agent:
 * 1. Searches LinkedIn and other professional networks for people at the company
 * 2. Extracts structured information about each person
 * 3. Optionally includes company information
 * 4. Returns data matching the Convex contacts schema
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
    // Gather information from multiple sources
    const peopleResults = await searchPeopleAtCompany(companyName, role, numResults);
    
    let companyInfo = null;
    let domainInfo = null;
    
    if (includeCompanyInfo) {
      [companyInfo, domainInfo] = await Promise.all([
        searchCompanyInfo(companyName),
        findCompanyDomain(companyName),
      ]);
    }

    // Combine all search results
    const allResults = {
      people: peopleResults,
      ...(includeCompanyInfo && { companyInfo, domainInfo }),
    };

    // Use AI to extract and structure the information
    const result = await generateText({
      model,
      prompt: `You are a people search agent. Based on the following search results for people at "${companyName}"${role ? ` in ${role} roles` : ''}, extract and format the information as a JSON object.

SEARCH RESULTS:
${JSON.stringify(allResults, null, 2)}

REQUIRED JSON SCHEMA:
{
  "people": [
    {
      "name": "string (full name)",
      "firstName": "string (optional, first name)",
      "lastName": "string (optional, last name)",
      "company": "string (should be ${companyName})",
      "role": "string (job title)",
      "headline": "string (optional, professional headline/bio)",
      "linkedinUrl": "string (optional, LinkedIn profile URL)",
      "twitterUrl": "string (optional, Twitter/X profile URL)",
      "avatar": "string (optional, profile picture URL)",
      "location": {
        "city": "string (optional)",
        "state": "string (optional)",
        "country": "string (optional)",
        "timeZone": "string (optional)"
      },
      "emails": [
        {
          "email": "string",
          "isPrimary": "boolean (true for first email, false for others)",
          "position": "number (0, 1, 2, etc.)"
        }
      ]
    }
  ],
  ${includeCompanyInfo ? `"companyInfo": {
    "name": "string (company name)",
    "domain": "string (primary domain without www)",
    "websiteUrl": "string (optional)",
    "linkedinUrl": "string (optional)",
    "industry": "string (optional)"
  },` : ''}
  "totalFound": "number (total number of people found)"
}

INSTRUCTIONS:
1. Extract information for each person found in the search results
2. Split full names into firstName and lastName if possible
3. Extract LinkedIn URLs, roles, and any other available information
4. If emails are found, format them with isPrimary and position fields
5. ${includeCompanyInfo ? 'Extract company information from the search results' : 'Omit companyInfo field'}
6. Set totalFound to the actual number of people extracted
7. If information is not available, omit those fields
8. Ensure LinkedIn URLs are properly formatted

Return ONLY a valid JSON object matching the schema above. Do not include any other text or explanation.`,
    });

    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = PeopleSearchSchema.parse(parsed);
    return validated;
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
