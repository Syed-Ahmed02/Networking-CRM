/**
 * Company Research Agent
 * Searches for companies and extracts structured information using Exa and AI
 */

import { generateText } from 'ai';
import { model } from '../config';
import { CompanyResearchSchema, type CompanyResearchResult } from '../types';
import {
  searchCompanyInfo,
  findCompanyDomain,
  findSocialMediaProfiles,
  findCompanyNews,
} from '../exa-helpers';

export interface CompanyResearchInput {
  companyName: string;
  additionalContext?: string;
  includeNews?: boolean;
}

/**
 * Research a company and return structured data
 * 
 * This agent:
 * 1. Searches for company information using Exa
 * 2. Finds the company's domain and social media profiles
 * 3. Identifies key people at the company
 * 4. Optionally includes recent news
 * 5. Returns structured data matching the Convex organizations schema
 * 
 * @param input - Company research parameters
 * @returns Structured company research data
 */
export async function researchCompany(
  input: CompanyResearchInput
): Promise<CompanyResearchResult> {
  const { companyName, additionalContext, includeNews = false } = input;

  try {
    // Gather information from multiple sources
    const [companyInfo, domainInfo, socialMedia, news] = await Promise.all([
      searchCompanyInfo(companyName, additionalContext),
      findCompanyDomain(companyName),
      findSocialMediaProfiles(companyName),
      includeNews ? findCompanyNews(companyName) : Promise.resolve(null),
    ]);

    // Combine all search results
    const allResults = {
      companyInfo,
      domainInfo,
      socialMedia,
      news,
    };

    // Use AI to extract and structure the information
    const result = await generateText({
      model,
      prompt: `You are a company research agent. Based on the following search results about "${companyName}", extract and format the information as a JSON object.

SEARCH RESULTS:
${JSON.stringify(allResults, null, 2)}

REQUIRED JSON SCHEMA:
{
  "organization": {
    "name": "string (company name)",
    "domain": "string (primary domain, e.g., 'example.com' without www)",
    "websiteUrl": "string (optional, full website URL)",
    "linkedinUrl": "string (optional, LinkedIn company page)",
    "twitterUrl": "string (optional, Twitter/X profile)",
    "facebookUrl": "string (optional, Facebook page)",
    "phone": "string (optional)",
    "logoUrl": "string (optional)",
    "foundedYear": "number (optional)",
    "industry": "string (optional)",
    "employeeCount": "number (optional)",
    "description": "string (optional, brief company description)"
  },
  "keyPeople": [
    {
      "name": "string (full name)",
      "firstName": "string (optional)",
      "lastName": "string (optional)",
      "company": "string (should be ${companyName})",
      "role": "string (job title)",
      "headline": "string (optional, professional headline)",
      "linkedinUrl": "string (optional)",
      "twitterUrl": "string (optional)",
      "avatar": "string (optional, profile picture URL)",
      "location": {
        "city": "string (optional)",
        "state": "string (optional)",
        "country": "string (optional)"
      }
    }
  ],
  "insights": "string (key insights about the company, business, and market position)",
  "sources": [
    {
      "title": "string (source title)",
      "url": "string (source URL)"
    }
  ]
}

INSTRUCTIONS:
1. Extract company information from the search results
2. Identify 3-5 key people (executives, founders, key employees) if found in the results
3. Provide insights about the company's business and market position
4. List all source URLs used
5. If information is not available, omit those fields
6. Ensure the domain is just the hostname without www
7. Ensure all URLs are properly formatted

Return ONLY a valid JSON object matching the schema above. Do not include any other text or explanation.`,
    });

    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = CompanyResearchSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('Company research error:', error);
    throw new Error(`Failed to research company: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Research multiple companies in batch
 * 
 * @param companies - Array of company names to research
 * @returns Array of research results
 */
export async function researchCompanies(
  companies: Array<{ name: string; context?: string }>
): Promise<CompanyResearchResult[]> {
  const results = await Promise.allSettled(
    companies.map(({ name, context }) =>
      researchCompany({ companyName: name, additionalContext: context })
    )
  );

  return results
    .filter((result): result is PromiseFulfilledResult<CompanyResearchResult> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}
