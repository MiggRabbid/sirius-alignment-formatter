import * as vscode from 'vscode';
import { formatCode } from './formatter';
import { normalizeSettings, type FormatterSettings } from './formatter/settings';

const SUPPORTED_LANGUAGES = [
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact'
] as const;

export function activate(context: vscode.ExtensionContext): void {
  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.ProviderResult<vscode.TextEdit[]> {
      const settings = readFormatterSettings();

      if (!settings.enable || !isSupportedLanguage(document.languageId)) {
        return [];
      }

      const source = document.getText();
      const formatted = formatCode(source, settings, document.languageId);

      if (formatted === source) {
        return [];
      }

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(source.length)
      );

      return [vscode.TextEdit.replace(fullRange, formatted)];
    }
  };

  for (const language of SUPPORTED_LANGUAGES) {
    context.subscriptions.push(
      vscode.languages.registerDocumentFormattingEditProvider({ language }, provider)
    );
  }
}

export function deactivate(): void {
  // VS Code disposes registered providers through extension subscriptions.
}

function readFormatterSettings(): FormatterSettings {
  const config = vscode.workspace.getConfiguration('alignedStyleFormatter');

  return normalizeSettings({
    enable: config.get<boolean>('enable'),
    importFromMinColumn: config.get<number>('importFromMinColumn'),
    importFromMaxColumn: config.get<number>('importFromMaxColumn'),
    alignObjects: config.get<boolean>('alignObjects'),
    alignJsxProps: config.get<boolean>('alignJsxProps')
  });
}

function isSupportedLanguage(languageId: string): boolean {
  return SUPPORTED_LANGUAGES.some((language) => language === languageId);
}
