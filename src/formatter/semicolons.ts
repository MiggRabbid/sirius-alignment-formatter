import type { AnyNode } from './parse';
import { traverseAst } from './parse';
import { applyTextChanges, type TextChange } from './print';

export function ensureSemicolons(text: string, ast: AnyNode): string {
  const changes: TextChange[] = [];

  traverseAst(ast, (node, parent) => {
    if (!shouldEndWithSemicolon(node, parent) || hasSemicolon(text, node.end)) {
      return;
    }

    changes.push({
      start: node.end,
      end: node.end,
      text: ';'
    });
  });

  return applyTextChanges(text, changes);
}

function shouldEndWithSemicolon(node: AnyNode, parent: AnyNode | null): boolean {
  switch (node.type) {
    case 'ImportDeclaration':
    case 'ExpressionStatement':
    case 'ReturnStatement':
    case 'ThrowStatement':
    case 'BreakStatement':
    case 'ContinueStatement':
    case 'DebuggerStatement':
    case 'DoWhileStatement':
    case 'ClassProperty':
    case 'ClassPrivateProperty':
    case 'PropertyDefinition':
    case 'ClassAccessorProperty':
      return true;

    case 'TSTypeAliasDeclaration':
      return parent?.type !== 'ExportNamedDeclaration';

    case 'VariableDeclaration':
      return !isForHeaderDeclaration(node, parent) && parent?.type !== 'ExportNamedDeclaration';

    case 'ExportNamedDeclaration':
      return shouldExportNamedDeclarationEndWithSemicolon(node);

    case 'ExportDefaultDeclaration':
      return shouldExportDefaultDeclarationEndWithSemicolon(node);

    case 'ExportAllDeclaration':
      return true;

    default:
      return false;
  }
}

function shouldExportNamedDeclarationEndWithSemicolon(node: AnyNode): boolean {
  if (node.source || (Array.isArray(node.specifiers) && node.specifiers.length > 0)) {
    return true;
  }

  const declarationType = node.declaration?.type;

  return declarationType === 'VariableDeclaration'
    || declarationType === 'TSTypeAliasDeclaration'
    || declarationType === 'TSDeclareFunction';
}

function shouldExportDefaultDeclarationEndWithSemicolon(node: AnyNode): boolean {
  const declarationType = node.declaration?.type;

  return declarationType !== 'FunctionDeclaration'
    && declarationType !== 'ClassDeclaration'
    && declarationType !== 'TSInterfaceDeclaration';
}

function isForHeaderDeclaration(node: AnyNode, parent: AnyNode | null): boolean {
  if (!parent) {
    return false;
  }

  return (parent.type === 'ForStatement' && parent.init === node)
    || (parent.type === 'ForInStatement' && parent.left === node)
    || (parent.type === 'ForOfStatement' && parent.left === node);
}

function hasSemicolon(text: string, end: number): boolean {
  if (text[end - 1] === ';') {
    return true;
  }

  let index = end;

  while (index < text.length && /\s/u.test(text[index])) {
    index += 1;
  }

  return text[index] === ';';
}
