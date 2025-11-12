import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { model } from '@/lib/ai/config';
import {
  searchCompanyInfo,
  findCompanyDomain,
  findSocialMediaProfiles,
} from '@/lib/ai/exa-helpers';
import { searchPeople } from '@/lib/ai/agents/people-search';
import { webSearch } from "@exalabs/ai-sdk";
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
      webSearch: webSearch({
        type: "auto",                           // smart search
        numResults: 6,                          // get up to 6 results
        category: "company",                    // focus on companies
        contents: {
          text: { maxCharacters: 1000 },        // get up to 1000 chars per result
          livecrawl: "preferred",               // always get fresh content if possible
          summary: true,                        // get an AI summary for each result
        },
      }),
      searchPeople: tool({
        description:
          'Search for people at a company using Apollo filters (title, location, seniority).',
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
            const result = await searchPeople({
              companyName,
              role,
              numResults: count,
              includeCompanyInfo: true,
            });
            return {
              success: true,
              companyName,
              people: result.people.slice(0, count),
              totalFound: result.totalFound,
              companyInfo: result.companyInfo,
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
1. Web Search - Search the web for information about companies and people
2. Search People - Search for people at a company using Apollo filters (title, location, seniority)

When a user asks about a company or wants to find people, use the appropriate tools to gather real-time information. Company research uses Exa search helpers, while people search uses the Apollo database.

Be helpful, concise, and provide actionable insights. Format your responses clearly with proper markdown.`,
    stopWhen: stepCountIs(5),
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

