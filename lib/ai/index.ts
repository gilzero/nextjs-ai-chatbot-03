// filepath: lib/ai/index.ts
import { openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

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

if (process.env.ANTHROPIC_API_KEY) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const maskedKey = `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
  console.log("Anthropic API Key (masked):", maskedKey);
} else {
  console.log("Anthropic API Key is NOT set.");
}

export const anthropicModel = (apiIdentifier: string) => {
  try {
    return wrapLanguageModel({
      model: anthropic(apiIdentifier),
      middleware: customMiddleware,
    });
  } catch (error) {
    console.error('Error creating Anthropic model:', error);
    throw error; // Re-throw the error to prevent silent failures
  }
};

export const googleModel = (apiIdentifier: string) => {
  try {
    console.log("Creating Google model with:", apiIdentifier);
    return wrapLanguageModel({
      model: google(apiIdentifier),
      middleware: customMiddleware,
    });
  } catch (error) {
    console.error('Error creating Google model:', error);
    throw error;
  }
};

// Perplexity Integration
const perplexity = createOpenAICompatible({
  name: 'perplexity',
  headers: {
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  },
  baseURL: 'https://api.perplexity.ai/',
});

export const perplexityModel = (apiIdentifier: string) => {
  try {
    return wrapLanguageModel({
      model: perplexity(apiIdentifier),
      middleware: customMiddleware,
    });
  } catch (error) {
    console.error('Error creating Perplexity model:', error);
    throw error;
  }
};