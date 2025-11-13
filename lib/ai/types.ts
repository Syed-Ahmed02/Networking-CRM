/**
 * Type definitions for AI agents
 * These types align with Convex schema definitions
 */

import { z } from 'zod';

// Organization schema for AI agent output
export const OrganizationSchema = z.object({
  name: z.string().describe('Company name'),
  domain: z.string().describe('Primary domain (e.g., example.com)'),
  websiteUrl: z.string().optional().describe('Full website URL'),
  linkedinUrl: z.string().optional().describe('LinkedIn company page URL'),
  twitterUrl: z.string().optional().describe('Twitter/X profile URL'),
  facebookUrl: z.string().optional().describe('Facebook page URL'),
  phone: z.string().optional().describe('Company phone number'),
  logoUrl: z.string().optional().describe('Company logo URL'),
  foundedYear: z.number().optional().describe('Year company was founded'),
  industry: z.string().optional().describe('Industry or sector'),
  employeeCount: z.number().optional().describe('Number of employees'),
  description: z.string().optional().describe('Company description'),
});

export type OrganizationData = z.infer<typeof OrganizationSchema>;

// Contact/Person schema for AI agent output
export const ContactSchema = z.object({
  name: z.string().describe('Full name of the person'),
  firstName: z.string().optional().describe('First name'),
  lastName: z.string().optional().describe('Last name'),
  company: z.string().describe('Current company name'),
  role: z.string().describe('Job title or role'),
  headline: z.string().optional().describe('Professional headline or bio'),
  linkedinUrl: z.string().optional().describe('LinkedIn profile URL'),
  twitterUrl: z.string().optional().describe('Twitter/X profile URL'),
  avatar: z.string().optional().describe('Profile picture URL'),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    timeZone: z.string().optional(),
  }).optional().describe('Location information'),
  emails: z.array(z.object({
    email: z.string(),
    isPrimary: z.boolean(),
    position: z.number(),
  })).optional().describe('Email addresses'),
});

export type ContactData = z.infer<typeof ContactSchema>;

// Company research result
export const CompanyResearchSchema = z.object({
  organization: OrganizationSchema,
  keyPeople: z.array(ContactSchema).describe('Key people at the company'),
  insights: z.string().describe('Key insights about the company'),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })).describe('Source URLs used for research'),
});

export type CompanyResearchResult = z.infer<typeof CompanyResearchSchema>;

// People search result
export const PeopleSearchSchema = z.object({
  people: z.array(ContactSchema).describe('People found at the company'),
  companyInfo: OrganizationSchema.optional().describe('Company information if found'),
  totalFound: z.number().describe('Total number of people found'),
});

export type PeopleSearchResult = z.infer<typeof PeopleSearchSchema>;

// Outreach message schema
export const OutreachMessageSchema = z.object({
  subject: z.string().describe('Email subject line'),
  message: z.string().describe('Email body content'),
  tone: z.enum(['professional', 'casual', 'friendly']).describe('Tone of the message'),
  callToAction: z.string().describe('Primary call to action'),
  personalizationNotes: z.string().optional().describe('Notes on personalization used'),
});

export type OutreachMessageData = z.infer<typeof OutreachMessageSchema>;
