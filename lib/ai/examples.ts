/**
 * AI Agents Usage Examples
 * 
 * This file contains practical examples of how to use the AI agents
 * in your Next.js application with Convex.
 */

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  researchCompany,
  searchPeople,
  searchDecisionMakers,
  generateOutreachEmail,
  generateBulkOutreachEmails,
  type CompanyResearchResult,
  type PeopleSearchResult,
  type OutreachMessageData,
} from './agents';

/**
 * Example 1: Research a company and save to Convex
 * 
 * This function researches a company using Exa and AI,
 * then saves the organization and key people to your Convex database.
 */
export async function researchAndSaveCompany(
  companyName: string,
  convex: any, // ConvexReactClient
  userId: Id<'users'>
): Promise<{ organizationId: Id<'organizations'>; contactIds: Id<'contacts'>[] }> {
  // Step 1: Research the company
  const research = await researchCompany({
    companyName,
    includeNews: true,
  });

  // Step 2: Save organization to Convex
  const organizationId = await convex.mutation(api.organizations.create, {
    name: research.organization.name,
    domain: research.organization.domain,
    websiteUrl: research.organization.websiteUrl,
    linkedinUrl: research.organization.linkedinUrl,
    twitterUrl: research.organization.twitterUrl,
    facebookUrl: research.organization.facebookUrl,
    industry: research.organization.industry,
    employeeCount: research.organization.employeeCount,
    foundedYear: research.organization.foundedYear,
    logoUrl: research.organization.logoUrl,
  });

  // Step 3: Save key people as contacts
  const contactIds: Id<'contacts'>[] = [];
  
  for (const person of research.keyPeople) {
    const contactId = await convex.mutation(api.contacts.create, {
      name: person.name,
      firstName: person.firstName,
      lastName: person.lastName,
      company: person.company,
      role: person.role,
      headline: person.headline,
      stage: 'lead' as const,
      linkedinUrl: person.linkedinUrl,
      twitterUrl: person.twitterUrl,
      avatar: person.avatar,
      location: person.location,
      source: 'AI Research',
      sourceDisplayName: 'AI-Powered Company Research',
    });
    
    contactIds.push(contactId);
  }

  // Step 4: Log the activity
  await convex.mutation(api.activityLog.insert, {
    userId,
    type: 'import_completed',
    description: `Researched and imported ${research.organization.name} with ${contactIds.length} key people`,
  });

  return { organizationId, contactIds };
}

/**
 * Example 2: Find decision makers at a company and save as leads
 */
export async function findAndSaveDecisionMakers(
  companyName: string,
  convex: any,
  userId: Id<'users'>
): Promise<Id<'contacts'>[]> {
  // Search for decision makers
  const result = await searchDecisionMakers(companyName);

  // Save each person as a contact
  const contactIds: Id<'contacts'>[] = [];
  
  for (const person of result.people) {
    const contactId = await convex.mutation(api.contacts.create, {
      name: person.name,
      firstName: person.firstName,
      lastName: person.lastName,
      company: person.company,
      role: person.role,
      headline: person.headline,
      stage: 'lead' as const,
      linkedinUrl: person.linkedinUrl,
      location: person.location,
      emails: person.emails,
      source: 'AI Search',
      sourceDisplayName: 'AI-Powered People Search',
    });
    
    contactIds.push(contactId);
  }

  return contactIds;
}

/**
 * Example 3: Generate personalized outreach emails for all leads
 */
export async function generateOutreachForLeads(
  convex: any,
  userId: Id<'users'>,
  senderInfo: {
    name: string;
    company: string;
    role: string;
  },
  purpose: string
): Promise<Array<{ contactId: Id<'contacts'>; messageId: Id<'outreachMessages'> }>> {
  // Get all leads
  const leads = await convex.query(api.contacts.list, { stage: 'lead' });

  // Generate emails for each lead
  const results = [];
  
  for (const lead of leads) {
    try {
      // Generate personalized email
      const email = await generateOutreachEmail({
        contact: {
          name: lead.name,
          firstName: lead.firstName,
          company: lead.company,
          role: lead.role,
          headline: lead.headline,
          linkedinUrl: lead.linkedinUrl,
          location: lead.location,
        },
        tone: 'professional',
        purpose,
        senderInfo,
        callToAction: 'Schedule a 15-minute introductory call',
      });

      // Save the outreach message
      const messageId = await convex.mutation(api.outreach.createMessage, {
        contactId: lead._id,
        contactName: lead.name,
        company: lead.company,
        message: `Subject: ${email.subject}\n\n${email.message}`,
        tone: email.tone,
      });

      results.push({ contactId: lead._id, messageId });
    } catch (error) {
      console.error(`Failed to generate email for ${lead.name}:`, error);
    }
  }

  return results;
}

/**
 * Example 4: Research multiple companies in batch
 */
export async function batchResearchCompanies(
  companies: Array<{ name: string; context?: string }>,
  convex: any,
  userId: Id<'users'>
): Promise<Array<{ company: string; organizationId: Id<'organizations'> }>> {
  // Research all companies
  const results = await Promise.allSettled(
    companies.map(({ name, context }) =>
      researchCompany({ companyName: name, additionalContext: context })
    )
  );

  // Save successful results
  const saved = [];
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    
    if (result.status === 'fulfilled') {
      const research = result.value;
      
      try {
        const organizationId = await convex.mutation(api.organizations.create, {
          name: research.organization.name,
          domain: research.organization.domain,
          websiteUrl: research.organization.websiteUrl,
          linkedinUrl: research.organization.linkedinUrl,
          industry: research.organization.industry,
          employeeCount: research.organization.employeeCount,
        });
        
        saved.push({
          company: companies[i].name,
          organizationId,
        });
      } catch (error) {
        console.error(`Failed to save ${companies[i].name}:`, error);
      }
    }
  }

  return saved;
}

/**
 * Example 5: Generate follow-up emails for contacts not contacted recently
 */
export async function generateFollowUpsForStaleContacts(
  convex: any,
  userId: Id<'users'>,
  daysSinceLastContact: number = 14
): Promise<number> {
  // Get all contacts
  const contacts = await convex.query(api.contacts.list, {});

  const now = Date.now();
  const threshold = daysSinceLastContact * 24 * 60 * 60 * 1000;

  let followUpsGenerated = 0;

  for (const contact of contacts) {
    const timeSinceContact = now - contact.lastContacted;
    
    if (timeSinceContact > threshold && contact.stage !== 'closed') {
      // Get the last outreach message
      const messages = await convex.query(api.outreach.listMessages, {
        contactId: contact._id,
      });
      
      const lastMessage = messages[0];
      
      if (lastMessage) {
        try {
          // Generate follow-up
          const { generateFollowUpEmail } = await import('./agents/email-outreach');
          
          const followUp = await generateFollowUpEmail(
            {
              contact: {
                name: contact.name,
                firstName: contact.firstName,
                company: contact.company,
                role: contact.role,
              },
              tone: 'friendly',
            },
            lastMessage.message,
            Math.floor(timeSinceContact / (24 * 60 * 60 * 1000))
          );

          // Save follow-up message
          await convex.mutation(api.outreach.createMessage, {
            contactId: contact._id,
            contactName: contact.name,
            company: contact.company,
            message: `Subject: ${followUp.subject}\n\n${followUp.message}`,
            tone: followUp.tone,
          });

          followUpsGenerated++;
        } catch (error) {
          console.error(`Failed to generate follow-up for ${contact.name}:`, error);
        }
      }
    }
  }

  return followUpsGenerated;
}

/**
 * Example 6: Server Action for Next.js App Router
 * 
 * Use this pattern in your app/actions.ts file
 */
export async function serverActionExample() {
  'use server';
  
  // Example: Research company (server action)
  async function researchCompanyAction(companyName: string) {
    const result = await researchCompany({
      companyName,
      includeNews: true,
    });
    
    return result;
  }

  // Example: Generate email (server action)
  async function generateEmailAction(contactData: any) {
    const email = await generateOutreachEmail({
      contact: contactData,
      tone: 'professional',
      purpose: 'Introduce our product',
    });
    
    return email;
  }

  return { researchCompanyAction, generateEmailAction };
}

/**
 * Example 7: React Hook for client-side usage
 */
export function useCompanyResearch() {
  // This would be used in a React component
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CompanyResearchResult | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  const research = async (companyName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await researchCompany({ companyName });
      setResult(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { research, loading, result, error };
}

// Note: Import React at the top if using the hook example
import React from 'react';

