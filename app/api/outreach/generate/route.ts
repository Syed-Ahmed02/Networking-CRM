import { NextResponse } from 'next/server';
import { generateOutreachEmail } from '@/lib/ai/emailOutreach';
import { auth } from '@clerk/nextjs/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { contact, tone, purpose, senderInfo, additionalContext, callToAction } = body;

    if (!contact || !contact.name || !contact.company || !contact.role) {
      return NextResponse.json(
        { error: 'Missing required contact information' },
        { status: 400 }
      );
    }

    const email = await generateOutreachEmail({
      contact,
      tone: tone || 'professional',
      purpose: purpose || 'Connect and explore potential collaboration',
      senderInfo,
      additionalContext,
      callToAction: callToAction || 'Schedule a brief call to discuss how we can help',
    });

    return NextResponse.json({ email });
  } catch (error) {
    console.error('Outreach email generation error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate email';
    const isParseError = errorMessage.includes('parse') || 
                        errorMessage.includes('No object generated') ||
                        errorMessage.includes('could not parse');
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Full error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    
    return NextResponse.json(
      { 
        error: isParseError 
          ? 'The AI model had trouble generating a valid response. Please try again with a different purpose or tone, or check your API configuration.'
          : errorMessage 
      },
      { status: 500 }
    );
  }
}

