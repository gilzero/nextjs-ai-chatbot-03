// filepath: lib/ai/index.ts
import { openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string) => {
  return wrapLanguageModel({
    model: openai(apiIdentifier),
    middleware: customMiddleware,
  });
};

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log("Anthropic API Key:", process.env.ANTHROPIC_API_KEY);

export const anthropicModel = (apiIdentifier: string) => {
  try {
    console.log("Creating Anthropic model with:", apiIdentifier);
    return wrapLanguageModel({
      model: anthropic(apiIdentifier),
      middleware: customMiddleware,
    });
  } catch (error) {
    console.error('Error creating Anthropic model:', error);
    throw error; // Re-throw the error to prevent silent failures
  }
};