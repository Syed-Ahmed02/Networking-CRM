import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai/config';
import {
  searchCompanyInfo,
  searchPeopleAtCompany,
  findCompanyDomain,
  findSocialMediaProfiles,
} from '@/lib/ai/exa-helpers';

export const maxDuration = 60; // Longer timeout for agent operations

/**
 * Chat API route that integrates with AI agents
 * Supports natural language queries that trigger agent actions
 */
export async function POST(req: Request) {
  try {
    const { messages }: { messages: any[] } = await req.json();

    // Create tools for the AI to use
    const tools = {
      researchCompany: tool({
        description:
          'Research a company and get comprehensive information including domain, social media, industry, and key people',
        inputSchema: z.object({
          companyName: z.string().min(1).describe('The name of the company to research'),
          additionalContext: z
            .string()
            .describe('Additional context like industry or location (optional)')
            .optional(),
        }),
        execute: async ({ companyName, additionalContext }) => {
          try {
            const [companyInfo, domainInfo, socialMedia] = await Promise.all([
              searchCompanyInfo(companyName, additionalContext),
              findCompanyDomain(companyName),
              findSocialMediaProfiles(companyName),
            ]);

            return {
              success: true,
              companyName,
              data: {
                companyInfo: companyInfo.results.slice(0, 3),
                domain: domainInfo.results[0]?.domain,
                socialMedia: socialMedia.results,
              },
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      }),
      searchPeople: tool({
        description: 'Search for people working at a specific company, particularly on LinkedIn',
        inputSchema: z.object({
          companyName: z.string().min(1).describe('The company name to search for people'),
          role: z
            .string()
            .describe('Specific role or title to search for (e.g., "CEO", "CTO", "Engineering")')
            .optional(),
          numResults: z
            .number()
            .int()
            .positive()
            .max(50)
            .describe('Number of results to return (default: 10)')
            .optional(),
        }),
        execute: async ({ companyName, role, numResults }) => {
          try {
            const count = numResults ?? 10;
            const result = await searchPeopleAtCompany(companyName, role, count);
            return {
              success: true,
              companyName,
              people: result.results.slice(0, count),
              totalFound: result.totalFound,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      }),
    };

    const result = streamText({
      model,
      messages: convertToModelMessages(messages),
      tools,
      system: `You are an AI assistant for CoffeeAgent.AI, a professional networking platform. You help users research companies, find people, and generate outreach emails.

Your capabilities:
1. Research companies - Get comprehensive information about companies including their domain, social media, industry, and key people
2. Search for people - Find people working at specific companies, optionally filtered by role
3. Generate emails - Create personalized outreach emails (coming soon)

When a user asks about a company or wants to find people, use the appropriate tools to gather real-time information from the web using Exa search.

Be helpful, concise, and provide actionable insights. Format your responses clearly with proper markdown.`,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

