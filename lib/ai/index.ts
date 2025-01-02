/**
 * AI Model Integration Module
 *
 * This module provides functionality for creating and managing different AI model integrations
 * including OpenAI, Anthropic, and Google models. It includes utilities for API key handling,
 * model wrapping, and error management.
 *
 * Filepath: lib/ai/index.ts
 */

import { openai } from '@ai-sdk/openai';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'; // Import createOpenAICompatible
import { customMiddleware } from './custom-middleware';
import { logError } from '@/lib/utils'; // Import the logging utility

/**
 * Represents a string identifier for a specific AI model API key
 * Used throughout the module for type safety when handling API keys
 */
type ModelIdentifier = string;

/**
 * Masks an API key to prevent full exposure in logs
 * Shows only the first and last 4 characters for security
 *
 * @param apiKey - The API key to mask (can be undefined)
 * @returns A masked version of the API key, or a message if it's not set
 *
 * @example
 * maskApiKey('sk-1234567890abcdef'); // Returns 'sk-1...cdef'
 * maskApiKey(undefined); // Returns '🔑 API Key is NOT set.'
 */
const maskApiKey = (apiKey: string | undefined): string => {
  if (!apiKey) return '🔑 API Key is NOT set.';
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
};

/**
 * Logs the status of a model API key (masked)
 * Useful for debugging and monitoring model initialization
 *
 * @param modelName - The name of the model for logging purposes
 * @param apiKey - The API key to be logged (will be masked)
 */
const logModelStatus = (modelName: string, apiKey: string | undefined) => {
  console.log(`${modelName} API Key (masked):`, maskApiKey(apiKey));
};

/**
 * Creates a wrapped language model with error handling and logging
 * Applies custom middleware and provides standardized error management
 *
 * @template T - The type of the model creator function
 * @param modelCreator - Function that creates the base language model
 * @param apiIdentifier - The API key identifier (masked in logs)
 * @param modelName - The name of the model for logging purposes
 * @returns The wrapped language model with middleware applied
 * @throws Error if model creation fails
 *
 * @example
 * const wrappedModel = createWrappedModel(openai, 'api-key-here', 'OpenAI');
 */
const createWrappedModel = <T extends (...args: any[]) => any>(
  modelCreator: T,
  apiIdentifier: ModelIdentifier,
  modelName: string,
): ReturnType<typeof wrapLanguageModel> => {
  try {
    logModelStatus(modelName, apiIdentifier);
    console.log(`⚙️ Creating ${modelName} model`);
    return wrapLanguageModel({
      model: modelCreator(apiIdentifier),
      middleware: customMiddleware,
    });
  } catch (error) {
    const errorMessage = `🔥 Failed to create ${modelName} model: ${
      (error as Error).message || error
    }`;
    logError(errorMessage, error); // Log the error with the utility
    throw new Error(errorMessage);
  }
};

/**
 * Creates a wrapped OpenAI model
 * Uses the OpenAI SDK and applies custom middleware
 *
 * @param apiIdentifier - The OpenAI API key identifier
 * @returns A wrapped OpenAI language model ready for use
 */
export const customModel = (apiIdentifier: ModelIdentifier) => {
  try {
    return createWrappedModel(openai, apiIdentifier, 'OpenAI');
  } catch (error) {
    logError('Error creating custom OpenAI model', error);
    throw new Error('Failed to create custom OpenAI model.');
  }
};

/**
 * Creates a base Anthropic model configuration object
 * Sets up the initial configuration for Anthropic API integration
 *
 * @param apiKey - The Anthropic API key
 * @returns A configured Anthropic model instance
 */
const createAnthropicModel = (apiKey: ModelIdentifier) =>
  createAnthropic({ apiKey });

/**
 * Creates a wrapped Anthropic model
 * Configures and initializes an Anthropic model with middleware
 *
 * @param apiIdentifier - The Anthropic API key identifier
 * @returns A wrapped Anthropic language model ready for use
 */
export const anthropicModel = (apiIdentifier: ModelIdentifier) => {
  try {
    return createWrappedModel(createAnthropicModel, apiIdentifier, 'Anthropic');
  } catch (error) {
    logError('Error creating Anthropic model', error);
    throw new Error('Failed to create Anthropic model.');
  }
};

/**
 * Creates a wrapped Google model
 * Sets up and configures a Google AI model with middleware
 *
 * @param apiIdentifier - The Google API key identifier
 * @returns A wrapped Google language model ready for use
 */
export const googleModel = (apiIdentifier: ModelIdentifier) => {
  try {
    return createWrappedModel(google, apiIdentifier, 'Google');
  } catch (error) {
    logError('Error creating Google model', error);
    throw new Error('Failed to create Google model.');
  }
};

/**
 * Creates a wrapped Perplexity model
 * Sets up and configures a Perplexity AI model with middleware
 *
 * @param apiIdentifier - The Perplexity API key identifier
 * @returns A wrapped Perplexity language model ready for use
 */
const createPerplexityModel = (apiKey: ModelIdentifier) =>
  createOpenAICompatible({
    name: 'perplexity',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    baseURL: 'https://api.perplexity.ai/',
  });

export const perplexityModel = (apiIdentifier: ModelIdentifier) => {
  try {
    return createWrappedModel(createPerplexityModel, apiIdentifier, 'Perplexity');
  } catch (error) {
    logError('Error creating Perplexity model', error);
    throw new Error('Failed to create Perplexity model.');
  }
};