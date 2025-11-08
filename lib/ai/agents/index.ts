/**
 * AI Agents Index
 * Export all AI agents for easy importing
 */

// Company Research Agent
export {
  researchCompany,
  researchCompanies,
  type CompanyResearchInput,
} from './company-research';

// People Search Agent
export {
  searchPeople,
  searchPeopleByRoles,
  searchDecisionMakers,
  type PeopleSearchInput,
} from './people-search';

// Email Outreach Agent
export {
  generateOutreachEmail,
  generateBulkOutreachEmails,
  generateFollowUpEmail,
  improveEmail,
  type EmailOutreachInput,
} from './email-outreach';

// Re-export types
export type {
  OrganizationData,
  ContactData,
  CompanyResearchResult,
  PeopleSearchResult,
  OutreachMessageData,
} from '../types';

