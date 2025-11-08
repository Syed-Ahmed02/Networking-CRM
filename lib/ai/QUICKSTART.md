# AI Agents Quick Start Guide

Get started with the AI agents in 5 minutes!

## 1. Setup Environment Variables

Add to your `.env.local`:

```bash
OPENROUTER_API_KEY=your_key_here
EXA_API_KEY=your_key_here
```

Get your API keys:
- OpenRouter: https://openrouter.ai/keys
- Exa: https://exa.ai/

## 2. Import and Use

```typescript
import {
  researchCompany,
  searchPeople,
  generateOutreachEmail,
} from '@/lib/ai';
```

## 3. Quick Examples

### Research a Company

```typescript
const result = await researchCompany({
  companyName: 'Stripe',
});

console.log(result.organization); // Company data
console.log(result.keyPeople);    // Key people at the company
console.log(result.insights);     // AI-generated insights
```

### Find People at a Company

```typescript
const result = await searchPeople({
  companyName: 'Stripe',
  role: 'Engineering',
  numResults: 10,
});

console.log(result.people);       // Array of people
console.log(result.totalFound);   // Total count
```

### Generate Personalized Email

```typescript
const email = await generateOutreachEmail({
  contact: {
    name: 'John Doe',
    company: 'Stripe',
    role: 'VP of Engineering',
  },
  tone: 'professional',
  purpose: 'Introduce our developer tools platform',
});

console.log(email.subject);       // Email subject
console.log(email.message);       // Email body
```

## 4. Save to Convex

```typescript
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

// In a React component
const createOrg = useMutation(api.organizations.create);
const createContact = useMutation(api.contacts.create);

// Research and save
const research = await researchCompany({ companyName: 'Stripe' });

await createOrg({
  name: research.organization.name,
  domain: research.organization.domain,
  websiteUrl: research.organization.websiteUrl,
  linkedinUrl: research.organization.linkedinUrl,
  industry: research.organization.industry,
  employeeCount: research.organization.employeeCount,
});

for (const person of research.keyPeople) {
  await createContact({
    name: person.name,
    firstName: person.firstName,
    lastName: person.lastName,
    company: person.company,
    role: person.role,
    stage: 'lead',
    linkedinUrl: person.linkedinUrl,
  });
}
```

## 5. Error Handling

Always wrap agent calls in try-catch:

```typescript
try {
  const result = await researchCompany({ companyName: 'Acme' });
  // Use result
} catch (error) {
  console.error('Research failed:', error);
  // Handle error
}
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out [examples.ts](./examples.ts) for more usage patterns
- Explore [types.ts](./types.ts) for all available data structures

## Common Issues

**"Not authenticated" error**
→ Check your environment variables are set correctly

**Empty results**
→ Try adding more context or checking the company name spelling

**Rate limit errors**
→ Reduce concurrent requests or upgrade your API plan

## Support

- [Vercel AI SDK Docs](https://ai-sdk.dev/)
- [Exa AI Docs](https://docs.exa.ai/)
- [OpenRouter Docs](https://openrouter.ai/docs)

