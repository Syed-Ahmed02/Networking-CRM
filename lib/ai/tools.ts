import Exa from 'exa-js'
import {tool} from "ai"
import {z} from 'zod'
export const exa = new Exa(process.env.EXA_API_KEY);


export const searchPeople = tool({
  description: 'Search for people at a company using filters (title, location, seniority).',
  inputSchema: z.object({
    companyName: z.string().min(1).describe("The name of the company"),
    role: z.string().min(1).describe("The role of the person you're looking for"),
    location:z.string().min(1).describe("The location of the person you're looking for"),
    numResults:z.number().max(20).default(5)
  }),
  execute: async ({ companyName, role, location, numResults }) => {

    const query = `Find me people from ${companyName} who are ${role} and are located in ${location} `

    const {results} = await exa.search(query,{numResults});
    const people = results.slice(0, numResults).map((item) => {
      const [namePart, rolePart] = (item.title || '').split(' - ');
      return {
        name: namePart?.trim() || 'Unknown Person',
        role: rolePart?.trim() || role,
        title: rolePart?.trim() || role,
        company: companyName,
        headline: item.text?.trim() || undefined,
        linkedinUrl: item.url?.includes('linkedin.com/in/') ? item.url : '',
        sourceUrl: item.url,
        emails: [],
        location,
      };
    });

    return {
      companyName,
      totalFound: people.length,
      people,
    };
  },
});