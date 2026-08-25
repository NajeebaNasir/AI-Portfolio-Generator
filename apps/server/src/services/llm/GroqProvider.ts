import Groq from 'groq-sdk';
import { ILlmProvider, ChatMessage, LlmCompletionOptions } from './ILlmProvider';

export class GroqProvider implements ILlmProvider {
  readonly providerName = 'groq';
  private client: Groq | null = null;
  private hasValidKey = false;
  private discoveredModels: string[] = [];
  private isDiscovered = false;

  // Ranked capability hierarchy (prioritizing models with high TPM limits and fast JSON responses)
  private readonly MODEL_PRIORITY_RANKING = [
    'groq/compound-mini',
    'openai/gpt-oss-20b',
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'groq/compound',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'mixtral-8x7b-32768',
  ];

  constructor(apiKey?: string) {
    this.ensureClientInitialized(apiKey);
  }

  private ensureClientInitialized(overrideKey?: string) {
    if (!this.client || !this.hasValidKey) {
      const key = overrideKey || process.env.GROQ_API_KEY;
      if (key && key.trim() !== '' && key !== 'your_groq_api_key_here' && key.startsWith('gsk_')) {
        this.client = new Groq({ apiKey: key.trim() });
        this.hasValidKey = true;
      }
    }
  }

  /**
   * Auto-discovers all accessible models for the user's active API key and ranks them by quality
   */
  private async discoverBestModels(): Promise<string[]> {
    this.ensureClientInitialized();
    if (this.isDiscovered && this.discoveredModels.length > 0) {
      return this.discoveredModels;
    }

    if (!this.client || !this.hasValidKey) {
      return this.MODEL_PRIORITY_RANKING;
    }

    try {
      const response = await this.client.models.list();
      const availableIds = (response.data || [])
        .map((m: any) => m.id)
        .filter((id: string) => typeof id === 'string' && !id.includes('guard') && !id.includes('whisper') && !id.includes('orpheus'));

      // Sort discovered models according to our capability ranking
      const sorted = this.MODEL_PRIORITY_RANKING.filter((rankedId) => availableIds.includes(rankedId));

      // Append any other available chat models not explicitly in our ranking list
      for (const id of availableIds) {
        if (!sorted.includes(id) && (id.includes('llama') || id.includes('mixtral') || id.includes('gemma') || id.includes('qwen') || id.includes('groq') || id.includes('gpt'))) {
          sorted.push(id);
        }
      }

      if (sorted.length > 0) {
        this.discoveredModels = sorted;
        this.isDiscovered = true;
        console.log(`[GroqProvider] 🚀 Auto-discovered ${sorted.length} accessible models for your API key.`);
        console.log(`[GroqProvider] ⭐ Primary Model Selected: ${sorted[0]}`);
        return this.discoveredModels;
      }
    } catch (discoveryErr: any) {
      console.warn('[GroqProvider] Could not fetch live model list from Groq API, using default capability ranking:', discoveryErr.message);
    }

    this.discoveredModels = this.MODEL_PRIORITY_RANKING;
    this.isDiscovered = true;
    return this.discoveredModels;
  }

  async chatCompletion(messages: ChatMessage[], options?: LlmCompletionOptions): Promise<string> {
    this.ensureClientInitialized();
    if (!this.hasValidKey || !this.client) {
      throw new Error('GROQ_API_KEY is not configured. Falling back to deterministic engine.');
    }

    const availableModels = await this.discoverBestModels();
    
    // User requested explicit model override in .env or options takes top precedence if available
    const explicitEnvModel = process.env.GROQ_MODEL?.trim();
    const candidateModels: string[] = [];

    if (options?.model) {
      candidateModels.push(options.model);
    }
    if (explicitEnvModel && !candidateModels.includes(explicitEnvModel)) {
      candidateModels.push(explicitEnvModel);
    }
    for (const m of availableModels) {
      if (!candidateModels.includes(m)) {
        candidateModels.push(m);
      }
    }

    let lastError: any = null;

    for (const modelToTry of candidateModels) {
      try {
        const response = await this.client.chat.completions.create({
          model: modelToTry,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 3000,
          response_format: options?.responseFormat,
        });

        const content = response.choices[0]?.message?.content;
        if (content && content.trim().length > 0) {
          return content;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[GroqProvider] Model '${modelToTry}' returned ${err.status || err.message}. Auto-trying next best accessible model...`);
      }
    }

    console.error('[GroqProvider] All accessible Groq models failed:', lastError?.message || lastError);
    throw new Error(`Groq API Error: ${lastError?.message || 'All models failed'}`);
  }

  async generateStructuredJson<T>(messages: ChatMessage[], schemaDescription?: string): Promise<T> {
    if (!this.hasValidKey || !this.client) {
      throw new Error('GROQ_API_KEY is not configured. Falling back to deterministic engine.');
    }

    const systemPromptWithJsonInstruction =
      (schemaDescription ? `\nStrict Schema Target: ${schemaDescription}\n` : '') +
      '\nYou MUST output pure, valid JSON only. Do not include markdown code blocks, backticks, or any conversational text around the JSON.';

    const augmentedMessages: ChatMessage[] = [];
    let hasSystem = false;
    for (const msg of messages) {
      if (msg.role === 'system') {
        augmentedMessages.push({
          role: 'system',
          content: msg.content + systemPromptWithJsonInstruction,
        });
        hasSystem = true;
      } else {
        augmentedMessages.push(msg);
      }
    }
    if (!hasSystem) {
      augmentedMessages.unshift({
        role: 'system',
        content: 'You are an expert JSON generator. ' + systemPromptWithJsonInstruction,
      });
    }

    const rawResponse = await this.chatCompletion(augmentedMessages, {
      responseFormat: { type: 'json_object' },
      temperature: 0.1,
      // 2800 max tokens ensures full multi-section resume JSON without truncation while fitting inside TPM limits
      maxTokens: 2800,
    });

    try {
      let cleanJson = rawResponse.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.substring(7);
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.substring(3);
      }
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
      cleanJson = cleanJson.trim();

      return JSON.parse(cleanJson) as T;
    } catch (parseError: any) {
      console.error('[GroqProvider] JSON Parse Error. Raw output:', rawResponse);
      throw new Error(`Failed to parse structured JSON from LLM: ${parseError.message}`);
    }
  }
}
