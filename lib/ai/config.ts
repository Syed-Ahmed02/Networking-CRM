/**
 * AI Configuration
 * Shared configuration for AI SDK and Exa
 */

import { openrouter } from '../openrouter';
import Exa from 'exa-js';

// OpenRouter model configuration
// Using a capable model for complex reasoning and structured outputs
export const model = openrouter('anthropic/claude-3.5-sonnet');

// Exa client for web search
export const exa = new Exa(process.env.EXA_API_KEY);

// Default search configuration
export const DEFAULT_EXA_CONFIG = {
  numResults: 10,
  type: 'auto' as const,
  useAutoprompt: true,
};

// Model generation settings
export const DEFAULT_MODEL_SETTINGS = {
  temperature: 0.7,
  maxTokens: 4000,
};

