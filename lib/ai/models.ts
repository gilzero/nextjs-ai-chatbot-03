
// filepath: lib/ai/models.ts
// Define your models here.

    export interface Model {
      id: string;
      label: string;
      apiIdentifier: string;
      description: string;
    }

export const models: Array<Model> = [
  {
    id: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    apiIdentifier: 'claude-3-5-sonnet-20241022',
    description: 'Powerful model for complex tasks',
  },
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
  // {
  //   id: 'llama-3.1-sonar-large-128k-online',
  //   label: 'Perplexity Llama 3',
  //   apiIdentifier: 'llama-3.1-sonar-large-128k-online',
  //   description: 'Perplexity Llama 3 model',
  // },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gemini-2.0-flash-exp';