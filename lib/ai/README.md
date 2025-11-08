# AI Agents for Networking CRM

This directory contains AI-powered agents built with Vercel AI SDK v5, OpenRouter, and Exa AI for intelligent company research, people search, and email outreach.

## Overview

The AI agents are designed to populate your CRM with structured data that matches the Convex database schemas:
- **Company Research Agent**: Finds and structures company information
- **People Search Agent**: Discovers people at specific companies
- **Email Outreach Agent**: Generates personalized outreach emails

## Architecture

```
lib/ai/
├── agents/               # AI agent implementations
│   ├── company-research.ts
│   ├── people-search.ts
│   ├── email-outreach.ts
│   └── index.ts
├── config.ts            # AI SDK and Exa configuration
├── types.ts             # TypeScript types and Zod schemas
├── exa-helpers.ts       # Exa search utility functions
├── index.ts             # Main entry point
└── README.md            # This file
```

## Setup

### Environment Variables

Add these to your `.env.local` file:

```bash
# OpenRouter API Key (for AI model access)
OPENROUTER_API_KEY=your_openrouter_api_key

# Exa API Key (for web search)
EXA_API_KEY=your_exa_api_key
```

### Installation

All required dependencies are already installed:
- `ai` (Vercel AI SDK v5)
- `@openrouter/ai-sdk-provider` (OpenRouter provider)
- `exa-js` (Exa search SDK)
- `zod` (Schema validation)

## Usage

### 1. Company Research Agent

Research a company and get structured data about the organization and key people.

```typescript
import { researchCompany } from '@/lib/ai';

// Research a single company
const result = await researchCompany({
  companyName: 'Acme Corp',
  additionalContext: 'B2B SaaS company', // optional
  includeNews: true, // optional, includes recent news
});

// Result structure:
// {
//   organization: {
//     name: string,
//     domain: string,
//     websiteUrl?: string,
//     linkedinUrl?: string,
//     twitterUrl?: string,
//     industry?: string,
//     employeeCount?: number,
//     ...
//   },
//   keyPeople: [
//     {
//       name: string,
//       company: string,
//       role: string,
//       linkedinUrl?: string,
//       ...
//     }
//   ],
//   insights: string,
//   sources: [{ title: string, url: string }]
// }
```

**Batch Research:**

```typescript
import { researchCompanies } from '@/lib/ai';

const companies = [
  { name: 'Acme Corp', context: 'B2B SaaS' },
  { name: 'TechStart Inc', context: 'AI startup' },
];

const results = await researchCompanies(companies);
```

**Saving to Convex:**

```typescript
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

const createOrganization = useMutation(api.organizations.create);
const createContact = useMutation(api.contacts.create);

// Save organization
const orgId = await createOrganization({
  name: result.organization.name,
  domain: result.organization.domain,
  websiteUrl: result.organization.websiteUrl,
  linkedinUrl: result.organization.linkedinUrl,
  industry: result.organization.industry,
  employeeCount: result.organization.employeeCount,
  // ... other fields
});

// Save key people as contacts
for (const person of result.keyPeople) {
  await createContact({
    name: person.name,
    firstName: person.firstName,
    lastName: person.lastName,
    company: person.company,
    role: person.role,
    stage: 'lead',
    linkedinUrl: person.linkedinUrl,
    // ... other fields
  });
}
```

### 2. People Search Agent

Find people working at a specific company.

```typescript
import { searchPeople, searchDecisionMakers } from '@/lib/ai';

// Search for people at a company
const result = await searchPeople({
  companyName: 'Acme Corp',
  role: 'Engineering', // optional, filter by role
  numResults: 10, // optional, default is 10
  includeCompanyInfo: true, // optional, includes company data
});

// Result structure:
// {
//   people: [
//     {
//       name: string,
//       firstName?: string,
//       lastName?: string,
//       company: string,
//       role: string,
//       linkedinUrl?: string,
//       headline?: string,
//       location?: { city, state, country },
//       emails?: [{ email, isPrimary, position }],
//       ...
//     }
//   ],
//   companyInfo?: { ... }, // if includeCompanyInfo is true
//   totalFound: number
// }

// Search for decision makers (executives, VPs, directors)
const leaders = await searchDecisionMakers('Acme Corp');
```

**Saving to Convex:**

```typescript
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

const createContact = useMutation(api.contacts.create);

for (const person of result.people) {
  await createContact({
    name: person.name,
    firstName: person.firstName,
    lastName: person.lastName,
    company: person.company,
    role: person.role,
    stage: 'lead',
    linkedinUrl: person.linkedinUrl,
    headline: person.headline,
    location: person.location,
    emails: person.emails,
    // ... other fields
  });
}
```

### 3. Email Outreach Agent

Generate personalized outreach emails.

```typescript
import { generateOutreachEmail, generateFollowUpEmail } from '@/lib/ai';

// Generate an outreach email
const email = await generateOutreachEmail({
  contact: {
    name: 'John Doe',
    firstName: 'John',
    company: 'Acme Corp',
    role: 'VP of Engineering',
    headline: 'Building scalable systems at Acme',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    location: { city: 'San Francisco', state: 'CA' },
  },
  tone: 'professional', // 'professional' | 'casual' | 'friendly'
  purpose: 'Introduce our B2B SaaS platform that helps engineering teams',
  senderInfo: {
    name: 'Jane Smith',
    company: 'YourCompany',
    role: 'Sales Director',
  },
  callToAction: 'Schedule a 15-minute demo call',
  additionalContext: 'We recently helped a similar company reduce deployment time by 50%',
});

// Result structure:
// {
//   subject: string,
//   message: string,
//   tone: 'professional' | 'casual' | 'friendly',
//   callToAction: string,
//   personalizationNotes?: string
// }

// Generate a follow-up email
const followUp = await generateFollowUpEmail(
  {
    contact: { ... },
    tone: 'friendly',
  },
  previousEmail, // the previous email text
  7 // days since last email
);
```

**Bulk Email Generation:**

```typescript
import { generateBulkOutreachEmails } from '@/lib/ai';

const contacts = [
  { name: 'John Doe', company: 'Acme', role: 'VP Engineering' },
  { name: 'Jane Smith', company: 'TechCo', role: 'CTO' },
];

const emails = await generateBulkOutreachEmails(contacts, {
  tone: 'professional',
  purpose: 'Introduce our platform',
  senderInfo: { name: 'Your Name', company: 'YourCo' },
});

// emails = [
//   { contact: {...}, email: {...} },
//   { contact: {...}, email: {...} },
// ]
```

**Saving to Convex:**

```typescript
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

const createMessage = useMutation(api.outreach.createMessage);

await createMessage({
  contactId: contactId, // optional, link to contact
  contactName: contact.name,
  company: contact.company,
  message: `Subject: ${email.subject}\n\n${email.message}`,
  tone: email.tone,
});
```

## Data Flow for UI Generation

Following the [Vercel AI SDK Generative UI pattern](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces), you can stream structured data directly to React components:

```typescript
'use server';

import { streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { model } from '@/lib/ai/config';
import { CompanyResearchSchema } from '@/lib/ai/types';

export async function streamCompanyResearch(companyName: string) {
  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model,
      schema: CompanyResearchSchema,
      prompt: `Research ${companyName} and provide structured data...`,
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
```

Then in your React component:

```typescript
'use client';

import { readStreamableValue } from 'ai/rsc';
import { streamCompanyResearch } from './actions';

export function CompanyResearchUI({ companyName }: { companyName: string }) {
  const [data, setData] = useState<Partial<CompanyResearchResult>>();

  useEffect(() => {
    (async () => {
      const { object } = await streamCompanyResearch(companyName);
      
      for await (const partialObject of readStreamableValue(object)) {
        setData(partialObject);
      }
    })();
  }, [companyName]);

  return (
    <div>
      {data?.organization && (
        <CompanyCard organization={data.organization} />
      )}
      {data?.keyPeople && (
        <PeopleList people={data.keyPeople} />
      )}
    </div>
  );
}
```

## Type Definitions

All agents return strongly-typed data validated with Zod schemas:

- `CompanyResearchResult`: Company research output
- `PeopleSearchResult`: People search output
- `OutreachMessageData`: Email generation output
- `OrganizationData`: Organization/company data
- `ContactData`: Contact/person data

See `lib/ai/types.ts` for complete type definitions.

## Configuration

### Model Selection

The default model is configured in `lib/ai/config.ts`:

```typescript
export const model = openrouter('anthropic/claude-3.5-sonnet');
```

You can change this to any model supported by OpenRouter:
- `anthropic/claude-3.5-sonnet` (default, best for complex reasoning)
- `openai/gpt-4-turbo`
- `openai/gpt-3.5-turbo` (faster, cheaper)
- `meta-llama/llama-3-70b`

### Exa Search Configuration

Customize search behavior in `lib/ai/config.ts`:

```typescript
export const DEFAULT_EXA_CONFIG = {
  numResults: 10,
  type: 'auto' as const,
  useAutoprompt: true,
};
```

## Error Handling

All agents throw descriptive errors that you should catch:

```typescript
try {
  const result = await researchCompany({ companyName: 'Acme Corp' });
} catch (error) {
  console.error('Research failed:', error);
  // Handle error appropriately
}
```

## Best Practices

1. **Rate Limiting**: Be mindful of API rate limits for both OpenRouter and Exa
2. **Caching**: Consider caching research results to avoid redundant API calls
3. **Error Handling**: Always wrap agent calls in try-catch blocks
4. **Batch Processing**: Use batch functions for multiple operations
5. **Data Validation**: The agents return validated data, but always verify before saving to database

## Examples

See the agent files for inline documentation and examples:
- `lib/ai/agents/company-research.ts`
- `lib/ai/agents/people-search.ts`
- `lib/ai/agents/email-outreach.ts`

## Troubleshooting

### "Not authenticated" errors
Make sure your environment variables are set correctly.

### Empty or poor results
- Try adding more context to your queries
- Adjust the `numResults` parameter
- Check if the company name is spelled correctly

### Rate limit errors
- Reduce the number of concurrent requests
- Implement exponential backoff
- Consider upgrading your API plans

## Resources

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/ai-sdk-core/overview)
- [Exa AI Documentation](https://docs.exa.ai/)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Generative UI Guide](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces)

