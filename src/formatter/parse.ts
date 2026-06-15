import { parse } from '@babel/parser';

export interface ParseResult {
  ast: AnyNode;
  tokens: AnyNode[];
}

export type AnyNode = Record<string, any>;

export type Visitor = (node: AnyNode, parent: AnyNode | null) => void;

export function parseCode(text: string, languageId = 'typescriptreact'): ParseResult {
  const plugins: any[] = [
    'jsx',
    'typescript',
    'decorators-legacy',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'dynamicImport',
    'importAttributes',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'explicitResourceManagement'
  ];

  const ast = parse(text, {
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
    errorRecovery: false,
    attachComment: true,
    ranges: true,
    tokens: true,
    plugins
  });

  void languageId;

  return {
    ast: ast as AnyNode,
    tokens: (ast.tokens ?? []) as AnyNode[]
  };
}

export function traverseAst(node: AnyNode | null | undefined, visitor: Visitor, parent: AnyNode | null = null): void {
  if (!node || typeof node !== 'object') {
    return;
  }

  visitor(node, parent);

  for (const key of Object.keys(node)) {
    if (isMetadataKey(key)) {
      continue;
    }

    const value = node[key];

    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNode(child)) {
          traverseAst(child, visitor, node);
        }
      }

      continue;
    }

    if (isNode(value)) {
      traverseAst(value, visitor, node);
    }
  }
}

function isMetadataKey(key: string): boolean {
  return key === 'loc'
    || key === 'range'
    || key === 'start'
    || key === 'end'
    || key === 'tokens'
    || key === 'comments'
    || key === 'leadingComments'
    || key === 'innerComments'
    || key === 'trailingComments'
    || key === 'extra';
}

function isNode(value: unknown): value is AnyNode {
  return Boolean(value)
    && typeof value === 'object'
    && typeof (value as AnyNode).type === 'string'
    && typeof (value as AnyNode).start === 'number'
    && typeof (value as AnyNode).end === 'number';
}
