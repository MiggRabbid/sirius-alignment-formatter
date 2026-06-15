import { alignEnums } from './alignEnum';
import { alignJsxProps } from './alignJsx';
import { alignObjects } from './alignObject';
import { formatImports } from './importLayout';
import { parseCode, type ParseResult } from './parse';
import {
  detectEndOfLine,
  normalizeEndOfLine,
  restoreEndOfLine
} from './print';
import { ensureSemicolons } from './semicolons';
import { normalizeSettings, type FormatterSettings } from './settings';

type FormatterPass = (text: string, parseResult: ParseResult, settings: FormatterSettings) => string;

export function formatCode(source: string, settings?: Partial<FormatterSettings>, languageId = 'typescriptreact'): string {
  const normalizedSettings = normalizeSettings(settings);

  if (!normalizedSettings.enable || source.length === 0) {
    return source;
  }

  const endOfLine = detectEndOfLine(source);
  const originalText = normalizeEndOfLine(source);
  const initialParseResult = safeParse(originalText, languageId);

  if (!initialParseResult) {
    return source;
  }

  let currentText = originalText;
  let parseResult = initialParseResult;

  for (const pass of getFormatterPasses(normalizedSettings)) {
    const nextText = pass(currentText, parseResult, normalizedSettings);

    if (nextText === currentText) {
      continue;
    }

    const nextParseResult = safeParse(nextText, languageId);

    if (!nextParseResult) {
      continue;
    }

    currentText = nextText;
    parseResult = nextParseResult;
  }

  return restoreEndOfLine(currentText, endOfLine);
}

function getFormatterPasses(settings: FormatterSettings): FormatterPass[] {
  const passes: FormatterPass[] = [
    (text, parseResult) => formatImports(text, parseResult.ast, settings),
    (text, parseResult) => alignEnums(text, parseResult.ast)
  ];

  if (settings.alignObjects) {
    passes.push((text, parseResult) => alignObjects(text, parseResult.ast));
  }

  if (settings.alignJsxProps) {
    passes.push((text, parseResult) => alignJsxProps(text, parseResult.ast));
  }

  passes.push((text, parseResult) => ensureSemicolons(text, parseResult.ast));

  return passes;
}

function safeParse(text: string, languageId: string): ParseResult | null {
  try {
    return parseCode(text, languageId);
  } catch {
    return null;
  }
}
