import type { AnyNode } from './parse';
import { applyTextChanges, type TextChange } from './print';
import type { FormatterSettings } from './settings';
import {
  collectImportDeclarations,
  normalizeImportDeclaration,
  type NormalizedImport
} from './normalizeImports';

type ImportMode = 'single' | 'multiline';

export function formatImports(text: string, ast: AnyNode, settings: FormatterSettings): string {
  const imports = collectImportDeclarations(ast)
    .map((node) => normalizeImportDeclaration(node, text))
    .filter((node): node is NormalizedImport => Boolean(node));

  if (imports.length === 0) {
    return text;
  }

  const modes = chooseImportModes(imports, settings);
  const singleLineImports = imports.filter((item) => item.hasFrom && modes.get(item) !== 'multiline');
  const targetColumn = calculateFromColumn(singleLineImports, settings.importFromMinColumn);
  const changes: TextChange[] = [];

  for (const item of imports) {
    const replacement = printImport(item, modes.get(item) ?? 'single', targetColumn);

    if (replacement && replacement !== text.slice(item.node.start, item.node.end)) {
      changes.push({
        start: item.node.start,
        end: item.node.end,
        text: replacement
      });
    }
  }

  return applyTextChanges(text, changes);
}

function chooseImportModes(imports: NormalizedImport[], settings: FormatterSettings): Map<NormalizedImport, ImportMode> {
  const modes = new Map<NormalizedImport, ImportMode>();
  const importsWithFrom = imports.filter((item) => item.hasFrom);

  for (const item of importsWithFrom) {
    modes.set(item, 'single');
  }

  while (calculateFromColumn(importsWithFrom.filter((item) => modes.get(item) !== 'multiline'), settings.importFromMinColumn) > settings.importFromMaxColumn) {
    const candidates = importsWithFrom
      .filter((item) => modes.get(item) !== 'multiline' && item.canMultiline)
      .sort((left, right) => right.prefix.length - left.prefix.length);

    if (candidates.length === 0) {
      break;
    }

    const longestLength = candidates[0]?.prefix.length ?? 0;

    for (const candidate of candidates) {
      if (candidate.prefix.length === longestLength || candidate.prefix.length + 1 > settings.importFromMaxColumn) {
        modes.set(candidate, 'multiline');
      }
    }
  }

  return modes;
}

function calculateFromColumn(imports: NormalizedImport[], minColumn: number): number {
  const maxPrefixLength = imports.reduce((maxLength, item) => Math.max(maxLength, item.prefix.length), 0);

  return Math.max(minColumn, maxPrefixLength + 1);
}

function printImport(item: NormalizedImport, mode: ImportMode, targetColumn: number): string | null {
  if (!item.hasFrom) {
    return item.sideEffectStatement ?? null;
  }

  if (mode === 'multiline') {
    return printMultilineImport(item, targetColumn);
  }

  return `${item.prefix}${spacesBeforeFrom(item.prefix.length, targetColumn)}from ${item.sourceRaw};`;
}

function printMultilineImport(item: NormalizedImport, targetColumn: number): string {
  const head = item.prefix.slice(0, item.prefix.indexOf('{') + 1);
  const specifierLines = item.namedSpecifiers.map((specifier, index) => {
    const suffix = index === item.namedSpecifiers.length - 1 ? '' : ',';

    return `    ${specifier}${suffix}`;
  });
  const closingBrace = '}';

  return [
    head,
    ...specifierLines,
    `${closingBrace}${spacesBeforeFrom(closingBrace.length, targetColumn)}from ${item.sourceRaw};`
  ].join('\n');
}

function spacesBeforeFrom(prefixLength: number, targetColumn: number): string {
  return ' '.repeat(Math.max(1, targetColumn - prefixLength));
}
