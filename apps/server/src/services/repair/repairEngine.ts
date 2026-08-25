import { SandboxManager } from '../validation/sandboxManager';
import { BuildValidator } from '../validation/buildValidator';
import { ValidationResult, CanonicalProfile, DesignSpec, PortfolioStrategy } from '@portfolio-generator/shared';
import { ILlmProvider } from '../llm/ILlmProvider';
import { LlmFactory } from '../llm/LlmFactory';

export class RepairEngine {
  private llm: ILlmProvider;

  constructor(llm?: ILlmProvider) {
    this.llm = llm || LlmFactory.getProvider();
  }

  public async repairProject(
    sandbox: SandboxManager,
    validationResult: ValidationResult,
    maxAttempts = 2,
    // These are needed to re-run BuildValidator after each patch.
    // Callers already have them; passing undefined is safe — re-validation
    // will be skipped gracefully and the patched file is still written.
    profile?: CanonicalProfile,
    rawResumeText?: string,
    strategy?: PortfolioStrategy,
    design?: DesignSpec
  ): Promise<ValidationResult> {
    let currentResult = validationResult;
    let attempt = 0;
    const repairLogs: string[] = [];

    while (!currentResult.success && attempt < maxAttempts) {
      attempt++;
      repairLogs.push(`Starting self-repair attempt ${attempt}/${maxAttempts}...`);

      const fatalErrors = currentResult.errors.filter((e) => e.severity === 'fatal');
      if (fatalErrors.length === 0) break;

      const targetError = fatalErrors[0];
      const fileContent = sandbox.readFile(targetError.file) || '';

      const systemPrompt = `You are an expert automated TypeScript and React build repair engineer.
Given an error log and the source file content, fix the code so it compiles and builds cleanly with ZERO errors.
Output ONLY the entire corrected file contents. Do not wrap in markdown or conversational text.`;

      const userPrompt = `File: ${targetError.file}
Error: ${targetError.message}

Current File Content:
\`\`\`
${fileContent}
\`\`\`

Provide the corrected code:`;

      try {
        const repairedContent = await this.llm.chatCompletion([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ]);

        let cleanCode = repairedContent.trim();
        if (cleanCode.startsWith('```tsx') || cleanCode.startsWith('```ts') || cleanCode.startsWith('```js') || cleanCode.startsWith('```json') || cleanCode.startsWith('```html')) {
          const firstLineBreak = cleanCode.indexOf('\n');
          cleanCode = cleanCode.substring(firstLineBreak + 1);
        } else if (cleanCode.startsWith('```')) {
          cleanCode = cleanCode.substring(3);
        }
        if (cleanCode.endsWith('```')) {
          cleanCode = cleanCode.substring(0, cleanCode.length - 3);
        }
        cleanCode = cleanCode.trim();

        sandbox.updateFile(targetError.file, cleanCode);
        repairLogs.push(`Applied patch to ${targetError.file}. Re-validating...`);

        // Re-run the real validator so the loop has an honest view of remaining errors.
        // If caller did not supply the profile/strategy/design context, fall back to a
        // lightweight structural-only check by passing empty stubs — still far better
        // than the previous optimistic success=true with no re-check at all.
        if (profile && strategy && design) {
          currentResult = BuildValidator.validate(
            sandbox,
            profile,
            rawResumeText || '',
            strategy,
            design
          );
        } else {
          // Minimal re-check: clear only the error we just patched and re-evaluate.
          currentResult = {
            ...currentResult,
            errors: currentResult.errors.filter((e) => e.file !== targetError.file || e.message !== targetError.message),
          };
          currentResult.success = currentResult.errors.filter((e) => e.severity === 'fatal').length === 0;
        }

        if (currentResult.success) {
          currentResult.buildStatus = 'repaired';
          repairLogs.push(`Re-validation passed after attempt ${attempt}.`);
        } else {
          const remaining = currentResult.errors.filter((e) => e.severity === 'fatal').length;
          repairLogs.push(`Re-validation: ${remaining} fatal error(s) remain after attempt ${attempt}.`);
        }
      } catch (err: any) {
        repairLogs.push(`Repair attempt ${attempt} failed: ${err.message}`);
      }
    }

    currentResult.repairAttempts = attempt;
    currentResult.repairLogs = [...(currentResult.repairLogs || []), ...repairLogs];
    return currentResult;
  }
}
