import { ILlmProvider } from './ILlmProvider';
import { GroqProvider } from './GroqProvider';
import { HuggingFaceProvider } from './HuggingFaceProvider';

export class LlmFactory {
  private static instance: ILlmProvider | null = null;

  public static getProvider(): ILlmProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = process.env.LLM_PROVIDER || 'groq';

    if (providerType === 'huggingface') {
      this.instance = new HuggingFaceProvider();
    } else {
      this.instance = new GroqProvider();
    }

    return this.instance;
  }

  public static setProvider(provider: ILlmProvider): void {
    this.instance = provider;
  }
}
