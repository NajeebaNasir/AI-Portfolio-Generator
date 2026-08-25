export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
  model?: string;
}

export interface ILlmProvider {
  readonly providerName: string;
  chatCompletion(messages: ChatMessage[], options?: LlmCompletionOptions): Promise<string>;
  generateStructuredJson<T>(messages: ChatMessage[], schemaDescription?: string): Promise<T>;
}
