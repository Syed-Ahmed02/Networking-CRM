/**
 * Exa Search Helper Functions
 * Direct utility functions for web search using Exa (not tools)
 */

import { exa, DEFAULT_EXA_CONFIG } from './config';

/**
 * Search for company information
 */
export async function searchCompanyInfo(companyName: string, additionalContext?: string) {
  const query = additionalContext 
    ? `${companyName} ${additionalContext} company information website linkedin`
    : `${companyName} company information website linkedin`;
  
  try {
    const result = await exa.search(query, {
      ...DEFAULT_EXA_CONFIG,
      numResults: 5,
      contents: { text: { maxCharacters: 1500 } },
    });

    return {
      results: result.results.map(r => ({
        title: r.title,
        url: r.url,
        text: r.text || '',
        publishedDate: r.publishedDate,
      })),
      query,
    };
  } catch (error) {
    console.error('Exa company search error:', error);
    return { results: [], query, error: String(error) };
  }
}

/**
 * Search for people at a company
 */
export async function searchPeopleAtCompany(
  companyName: string,
  role?: string,
  numResults: number = 10
) {
  const roleQuery = role ? ` ${role}` : ' employees people team';
  const query = `site:linkedin.com/in ${companyName}${roleQuery}`;
  
  try {
    const result = await exa.search(query, {
      ...DEFAULT_EXA_CONFIG,
      numResults,
      contents: { text: { maxCharacters: 1000 } },
      includeDomains: ['linkedin.com'],
    });

    return {
      results: result.results.map(r => ({
        title: r.title,
        url: r.url,
        text: r.text || '',
        publishedDate: r.publishedDate,
      })),
      query,
      totalFound: result.results.length,
    };
  } catch (error) {
    console.error('Exa people search error:', error);
    return { results: [], query, totalFound: 0, error: String(error) };
  }
}

/**
 * Find company domain
 */
export async function findCompanyDomain(companyName: string) {
  const query = `${companyName} official website`;
  
  try {
    const result = await exa.search(query, {
      ...DEFAULT_EXA_CONFIG,
      numResults: 3,
      contents: { text: { maxCharacters: 500 } },
    });

    return {
      results: result.results.map(r => ({
        title: r.title,
        url: r.url,
        domain: new URL(r.url).hostname.replace('www.', ''),
      })),
    };
  } catch (error) {
    console.error('Exa domain finder error:', error);
    return { results: [], error: String(error) };
  }
}

/**
 * Find social media profiles
 */
export async function findSocialMediaProfiles(companyName: string, domain?: string) {
  const domainQuery = domain ? ` ${domain}` : '';
  const query = `${companyName}${domainQuery} linkedin twitter facebook`;
  
  try {
    const result = await exa.search(query, {
      ...DEFAULT_EXA_CONFIG,
      numResults: 8,
      includeDomains: ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com'],
      contents: { text: { maxCharacters: 1000 } },
    });

    return {
      results: result.results.map(r => ({
        title: r.title,
        url: r.url,
        platform: r.url.includes('linkedin') ? 'linkedin' 
          : r.url.includes('twitter') || r.url.includes('x.com') ? 'twitter'
          : r.url.includes('facebook') ? 'facebook'
          : 'other',
      })),
    };
  } catch (error) {
    console.error('Exa social media finder error:', error);
    return { results: [], error: String(error) };
  }
}

/**
 * Find recent company news
 */
export async function findCompanyNews(
  companyName: string,
  timeframe: 'week' | 'month' | 'year' = 'month'
) {
  const query = `${companyName} news updates announcements`;
  
  // Calculate date filter based on timeframe
  const now = new Date();
  const startDate = new Date();
  if (timeframe === 'week') startDate.setDate(now.getDate() - 7);
  else if (timeframe === 'month') startDate.setMonth(now.getMonth() - 1);
  else startDate.setFullYear(now.getFullYear() - 1);
  
  try {
    const result = await exa.search(query, {
      ...DEFAULT_EXA_CONFIG,
      numResults: 5,
      contents: { text: { maxCharacters: 500 } },
      startPublishedDate: startDate.toISOString().split('T')[0],
    });

    return {
      results: result.results.map(r => ({
        title: r.title,
        url: r.url,
        text: r.text || '',
        publishedDate: r.publishedDate,
      })),
      timeframe,
    };
  } catch (error) {
    console.error('Exa company news error:', error);
    return { results: [], timeframe, error: String(error) };
  }
}

