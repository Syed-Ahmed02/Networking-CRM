/**
 * Email Outreach Agent
 * Creates personalized outreach emails using AI
 */

import { generateObject } from 'ai';
import { openrouter } from '../openrouter';
import { OutreachMessageSchema, type OutreachMessageData } from './types';

export interface EmailOutreachInput {
  contact: {
    name: string;
    firstName?: string;
    company: string;
    role: string;
    headline?: string;
    linkedinUrl?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  tone: 'professional' | 'casual' | 'friendly';
  purpose: string;
  senderInfo?: {
    name?: string;
    company?: string;
    role?: string;
  };
  additionalContext?: string;
  callToAction?: string;
}

/**
 * Generate a personalized outreach email
 * 
 * This agent:
 * 1. Analyzes the contact's information
 * 2. Creates a personalized email based on tone and purpose
 * 3. Includes relevant personalization elements
 * 4. Returns structured email data matching the Convex outreach schema
 * 
 * @param input - Email generation parameters
 * @returns Structured outreach message data
 */
export async function generateOutreachEmail(
  input: EmailOutreachInput
): Promise<OutreachMessageData> {
  const {
    contact,
    tone,
    purpose,
    senderInfo,
    additionalContext,
    callToAction,
  } = input;

  const firstName = contact.firstName || contact.name.split(' ')[0];
  const defaultCallToAction = callToAction || 'Schedule a brief call to discuss how we can help';

  try {
    const result = await generateObject({
      model:openrouter('openai/gpt-4o-mini'),
      schema: OutreachMessageSchema,
      temperature: 0.7,
      prompt: `You are an expert email outreach writer. Create a personalized, compelling outreach email.

IMPORTANT: You must return a valid JSON object. All string values must be properly escaped for JSON. Use \\n for line breaks, not actual newlines.

CONTACT INFORMATION:
- Name: ${contact.name}
- First Name: ${firstName}
- Company: ${contact.company}
- Role: ${contact.role}
${contact.headline ? `- Headline: ${contact.headline}` : ''}
${contact.location?.city ? `- Location: ${contact.location.city}${contact.location.state ? `, ${contact.location.state}` : ''}` : ''}
${contact.linkedinUrl ? `- LinkedIn: ${contact.linkedinUrl}` : ''}

${senderInfo ? `SENDER INFORMATION:
${senderInfo.name ? `- Name: ${senderInfo.name}` : ''}
${senderInfo.company ? `- Company: ${senderInfo.company}` : ''}
${senderInfo.role ? `- Role: ${senderInfo.role}` : ''}
` : ''}

EMAIL REQUIREMENTS:
- Tone: ${tone}
- Purpose: ${purpose}
- Call to Action: ${defaultCallToAction}
${additionalContext ? `- Additional Context: ${additionalContext}` : ''}

INSTRUCTIONS:
1. Create a compelling subject line (5-8 words, specific and personalized)
2. Write the email body with these elements:
   - Personalized greeting using their first name
   - Brief, relevant personalization (reference their role, company, or headline)
   - Clear value proposition or reason for reaching out
   - Specific call to action: "${defaultCallToAction}"
   - Professional closing
3. Keep the email concise (150-250 words)
4. Match the specified tone: ${tone}
5. Make it feel genuine and personalized, not templated
6. Include personalization notes explaining what personalization elements you used

TONE GUIDELINES:
- Professional: Formal, business-focused, respectful
- Casual: Conversational, friendly but still professional
- Friendly: Warm, approachable, personable

AVOID:
- Generic templates or obvious copy-paste language
- Being overly salesy or pushy
- Making assumptions about their needs
- Using buzzwords or corporate jargon excessively
- Writing overly long emails

CRITICAL JSON FORMATTING REQUIREMENTS:
- You MUST return valid JSON that can be parsed by a JSON parser
- All newlines in the "message" field MUST be escaped as \\n (backslash followed by n)
- Do NOT use actual line breaks in JSON string values
- Escape all special characters: quotes as \\", backslashes as \\\\
- The message field should be a single string with \\n for line breaks

Example of correct format:
{
  "subject": "Example Subject Line",
  "message": "Dear John,\\n\\nThis is the first paragraph.\\n\\nThis is the second paragraph.\\n\\nBest regards,\\nYour Name",
  "tone": "${tone}",
  "callToAction": "${defaultCallToAction}",
  "personalizationNotes": "Notes here"
}

Return ONLY valid JSON, no markdown code blocks, no explanations, just the JSON object.`,
    });

    // Validate the result
    if (!result.object) {
      throw new Error('No object generated: The AI model did not return a valid response');
    }

    return result.object;
  } catch (error: any) {
    console.error('Email generation error:', error);
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    // Check if we have a text response we can try to repair
    if (error?.cause?.text) {
      try {
        let text = error.cause.text.trim();
        
        // Remove markdown code blocks if present
        text = text.replace(/^```json\n?/i, '').replace(/```\s*$/, '').trim();
        
        // Try to repair JSON by fixing newlines inside string values
        // This regex finds string values and replaces literal newlines with escaped ones
        let repairedText = text;
        let inString = false;
        let escapeNext = false;
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          
          if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            result += char;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            result += char;
            continue;
          }
          
          if (inString && (char === '\n' || char === '\r')) {
            result += '\\n';
            if (char === '\r' && text[i + 1] === '\n') {
              i++; // Skip the \n after \r
            }
          } else {
            result += char;
          }
        }
        
        const parsed = JSON.parse(result);
        console.log('Successfully repaired JSON');
        return parsed as OutreachMessageData;
      } catch (repairError) {
        console.error('Failed to repair JSON:', repairError);
      }
    }
    
    throw new Error(`Failed to generate email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate multiple personalized emails for a list of contacts
 * 
 * @param contacts - Array of contacts
 * @param baseInput - Base email parameters (tone, purpose, etc.)
 * @returns Array of generated emails
 */
export async function generateBulkOutreachEmails(
  contacts: Array<EmailOutreachInput['contact']>,
  baseInput: Omit<EmailOutreachInput, 'contact'>
): Promise<Array<{ contact: EmailOutreachInput['contact']; email: OutreachMessageData }>> {
  const results = await Promise.allSettled(
    contacts.map(async (contact) => {
      const email = await generateOutreachEmail({
        contact,
        ...baseInput,
      });
      return { contact, email };
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<{ contact: EmailOutreachInput['contact']; email: OutreachMessageData }> =>
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

/**
 * Generate a follow-up email
 * 
 * @param input - Follow-up email parameters
 * @param previousEmail - The previous email sent
 * @param daysSinceLast - Number of days since the last email
 * @returns Structured follow-up email data
 */
export async function generateFollowUpEmail(
  input: Omit<EmailOutreachInput, 'purpose'>,
  previousEmail: string,
  daysSinceLast: number
): Promise<OutreachMessageData> {
  const { contact, tone, senderInfo, additionalContext, callToAction } = input;
  const firstName = contact.firstName || contact.name.split(' ')[0];

  try {
    const result = await generateObject({
      model:openrouter('openai/gpt-4o-mini'),
      schema: OutreachMessageSchema,
      prompt: `You are an expert email outreach writer. Create a personalized follow-up email.

CONTACT INFORMATION:
- Name: ${contact.name}
- First Name: ${firstName}
- Company: ${contact.company}
- Role: ${contact.role}

CONTEXT:
- Days since last email: ${daysSinceLast}
- Previous email sent:
${previousEmail}

${senderInfo ? `SENDER INFORMATION:
${senderInfo.name ? `- Name: ${senderInfo.name}` : ''}
${senderInfo.company ? `- Company: ${senderInfo.company}` : ''}
${senderInfo.role ? `- Role: ${senderInfo.role}` : ''}
` : ''}

FOLLOW-UP REQUIREMENTS:
- Tone: ${tone}
- This is a follow-up to the previous email
${callToAction ? `- Call to Action: ${callToAction}` : '- Include a clear, specific call to action'}
${additionalContext ? `- Additional Context: ${additionalContext}` : ''}

INSTRUCTIONS:
1. Create a subject line that references the previous email or adds new value
2. Write a brief follow-up that:
   - Acknowledges you're following up
   - Adds new value or information (don't just repeat the previous email)
   - Respects their time
   - Includes a clear, easy call to action
3. Keep it even shorter than the initial email (100-150 words)
4. Match the specified tone: ${tone}
5. Be respectful and not pushy

AVOID:
- Sounding desperate or pushy
- Repeating the exact same message
- Being passive-aggressive about not receiving a response
- Making them feel guilty

Return the structured email data following the schema.`,
    });

    return result.object;
  } catch (error) {
    console.error('Follow-up email generation error:', error);
    throw new Error(`Failed to generate follow-up email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Improve or rewrite an existing email
 * 
 * @param originalEmail - The original email text
 * @param improvements - Specific improvements to make
 * @param tone - Desired tone
 * @returns Improved email
 */
export async function improveEmail(
  originalEmail: string,
  improvements: string,
  tone: 'professional' | 'casual' | 'friendly'
): Promise<OutreachMessageData> {
  try {
    const result = await generateObject({
      model:openrouter('openai/gpt-4o-mini'),
      schema: OutreachMessageSchema,
      prompt: `You are an expert email editor. Improve the following email based on the requested changes.

ORIGINAL EMAIL:
${originalEmail}

REQUESTED IMPROVEMENTS:
${improvements}

DESIRED TONE: ${tone}

INSTRUCTIONS:
1. Rewrite the email incorporating the requested improvements
2. Maintain the core message and intent
3. Match the specified tone: ${tone}
4. Ensure the email is clear, concise, and compelling
5. Create an appropriate subject line
6. Include notes on what changes you made

Return the improved email following the schema.`,
    });

    return result.object;
  } catch (error) {
    console.error('Email improvement error:', error);
    throw new Error(`Failed to improve email: ${error instanceof Error ? error.message : String(error)}`);
  }
}
