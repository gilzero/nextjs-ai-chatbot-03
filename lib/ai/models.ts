/**
 * AI Models Configuration
 * Defines available AI models and their properties for the application.
 * This module manages model definitions, including their identifiers,
 * display labels, and descriptions.
 * 
 * Filepath: lib/ai/models.ts
 */

/**
 * Interface defining the structure of an AI model configuration
 */
export interface Model {
  /** Unique identifier for the model */
  id: string;
  
  /** Display name shown in the UI */
  label: string;
  
  /** Identifier used when making API calls */
  apiIdentifier: string;
  
  /** Brief description of the model's capabilities */
  description: string;
}

/**
 * Available AI models configuration
 * Contains the list of all supported models with their properties
 * Note: Models can be commented out to disable them temporarily
 */
export const models: Array<Model> = [
  // Commented out models for future reference
  // {
  //   id: 'claude-3-5-sonnet-20241022',
  //   label: 'Claude 3.5 Sonnet',
  //   apiIdentifier: 'claude-3-5-sonnet-20241022',
  //   description: 'Powerful model for complex tasks',
  // },
  
  {
    id: 'gpt-4o',
    label: 'Weiming AI Standard',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
  
  {
    id: 'gpt-4o-mini',
    label: 'Weiming AI Mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  
  {
    id: 'gemini-2.0-flash-exp',
    label: 'Weiming AI Flash',
    apiIdentifier: 'gemini-2.0-flash-exp',
    description: 'Fast and efficient model',
  },
  
  // Disabled Perplexity model
  // {
  //   id: 'llama-3.1-sonar-small-128k-online',
  //   label: 'Perplexity Sonar Small',
  //   apiIdentifier: 'llama-3.1-sonar-small-128k-online',
  //   description: 'Perplexity Llama 3 model',
  // },
] as const;

/**
 * Default model identifier used when no specific model is selected
 * Currently set to the Weiming AI Flash model for optimal performance
 */
export const DEFAULT_MODEL_NAME: string = 'gemini-2.0-flash-exp';