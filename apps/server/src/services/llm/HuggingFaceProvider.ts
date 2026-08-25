import { ILlmProvider, ChatMessage, LlmCompletionOptions } from './ILlmProvider';

export class HuggingFaceProvider implements ILlmProvider {
  readonly providerName = 'huggingface';
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey?: string, endpoint?: string) {
    this.apiKey = apiKey || process.env.HF_API_KEY || '';
    this.endpoint =
      endpoint ||
      process.env.HF_INFERENCE_ENDPOINT ||
      'https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct';
  }

  async chatCompletion(messages: ChatMessage[], options?: LlmCompletionOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('HF_API_KEY is not configured for HuggingFaceProvider.');
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n') + '\n\nASSISTANT: ',
        parameters: {
          max_new_tokens: options?.maxTokens ?? 2048,
          temperature: options?.temperature ?? 0.1,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }
    if (typeof data.generated_text === 'string') {
      return data.generated_text;
    }
    return JSON.stringify(data);
  }

  async generateStructuredJson<T>(messages: ChatMessage[], schemaDescription?: string): Promise<T> {
    const raw = await this.chatCompletion(messages);
    let cleanJson = raw.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    return JSON.parse(cleanJson.trim()) as T;
  }
}
