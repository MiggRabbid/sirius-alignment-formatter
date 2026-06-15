import type { AnyNode } from './parse';
import { traverseAst } from './parse';
import {
  applyTextChanges,
  getIndent,
  getLineBounds,
  getLineStarts,
  hasCommentMarker,
  type TextChange
} from './print';

interface AlignableVariableDeclarator {
  lineNumber: number;
  lineStart: number;
  lineEnd: number;
  indent: string;
  leftSide: string;
  initStart: number;
  spacesAfterOperator: string;
}

export function alignVariables(text: string, ast: AnyNode): string {
  const lineStarts = getLineStarts(text);
  const changes: TextChange[] = [];
  const declarations = collectAlignableVariableDeclarators(text, ast, lineStarts);

  for (const group of splitConsecutiveGroups(declarations)) {
    changes.push(...alignVariableGroup(text, group));
  }

  return applyTextChanges(text, changes);
}

function collectAlignableVariableDeclarators(text: string, ast: AnyNode, lineStarts: number[]): AlignableVariableDeclarator[] {
  const declarations: AlignableVariableDeclarator[] = [];

  traverseAst(ast, (node) => {
    if (node.type !== 'VariableDeclaration' || !Array.isArray(node.declarations) || node.declarations.length !== 1) {
      return;
    }

    const declarator = toAlignableVariableDeclarator(text, node.declarations[0], node, lineStarts);

    if (declarator) {
      declarations.push(declarator);
    }
  });

  return declarations;
}

function toAlignableVariableDeclarator(
  text: string,
  declarator: AnyNode,
  declaration: AnyNode,
  lineStarts: number[]
): AlignableVariableDeclarator | null {
  if (!declarator?.id || !declarator.init || !declaration.loc || !declarator.loc) {
    return null;
  }

  if (typeof declarator.id.end !== 'number' || typeof declarator.init.start !== 'number') {
    return null;
  }

  if (declaration.loc.start.line !== declaration.loc.end.line || declarator.loc.start.line !== declarator.init.loc?.start.line) {
    return null;
  }

  const lineNumber = declaration.loc.start.line - 1;
  const [lineStart, lineEnd] = getLineBounds(text, lineNumber, lineStarts);
  const line = text.slice(lineStart, lineEnd);
  const indent = getIndent(line);

  if (declaration.loc.start.column !== indent.length) {
    return null;
  }

  const operatorSegment = text.slice(declarator.id.end, declarator.init.start);

  if (!operatorSegment.includes('=') || hasCommentMarker(operatorSegment)) {
    return null;
  }

  const operatorIndex = operatorSegment.indexOf('=');
  const rawSpacesAfterOperator = operatorSegment.slice(operatorIndex + 1);
  const spacesAfterOperator = rawSpacesAfterOperator.length > 0 ? rawSpacesAfterOperator : ' ';

  return {
    lineNumber,
    lineStart,
    lineEnd,
    indent,
    leftSide: text.slice(lineStart + indent.length, declarator.id.end).trimEnd(),
    initStart: declarator.init.start,
    spacesAfterOperator
  };
}

function alignVariableGroup(text: string, group: AlignableVariableDeclarator[]): TextChange[] {
  if (group.length === 0) {
    return [];
  }

  const maxLeftSideLength = group.reduce(
    (maxLength, declaration) => Math.max(maxLength, declaration.leftSide.length),
    0
  );

  return group.map((declaration) => {
    const value = text.slice(declaration.initStart, declaration.lineEnd);
    const padding = ' '.repeat(maxLeftSideLength - declaration.leftSide.length + 1);

    return {
      start: declaration.lineStart,
      end: declaration.lineEnd,
      text: `${declaration.indent}${declaration.leftSide}${padding}=${declaration.spacesAfterOperator}${value}`
    };
  });
}

function splitConsecutiveGroups<T extends { lineNumber: number; indent: string }>(items: T[]): T[][] {
  const groups: T[][] = [];

  for (const item of items) {
    const currentGroup = groups[groups.length - 1];
    const previousItem = currentGroup?.[currentGroup.length - 1];

    if (
      !currentGroup
      || !previousItem
      || item.lineNumber !== previousItem.lineNumber + 1
      || item.indent !== previousItem.indent
    ) {
      groups.push([item]);
      continue;
    }

    currentGroup.push(item);
  }

  return groups;
}
