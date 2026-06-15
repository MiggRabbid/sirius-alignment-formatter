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

interface AlignableObjectProperty {
  lineNumber: number;
  lineStart: number;
  lineEnd: number;
  indent: string;
  key: string;
  valueStart: number;
}

export function alignObjects(text: string, ast: AnyNode): string {
  const lineStarts = getLineStarts(text);
  const changes: TextChange[] = [];

  traverseAst(ast, (node) => {
    if (node.type !== 'ObjectExpression' || !Array.isArray(node.properties)) {
      return;
    }

    const properties = node.properties
      .map((property: AnyNode) => toAlignableObjectProperty(text, property, lineStarts))
      .filter((property): property is AlignableObjectProperty => Boolean(property));

    for (const group of splitConsecutiveGroups(properties)) {
      changes.push(...alignObjectGroup(text, group));
    }
  });

  return applyTextChanges(text, changes);
}

function toAlignableObjectProperty(text: string, property: AnyNode, lineStarts: number[]): AlignableObjectProperty | null {
  if (property.type !== 'ObjectProperty' || property.shorthand || property.method || !property.loc) {
    return null;
  }

  if (!property.key || !property.value || typeof property.key.end !== 'number' || typeof property.value.start !== 'number') {
    return null;
  }

  if (property.loc.start.line !== property.value.loc?.start.line || property.key.loc?.end.line !== property.value.loc?.start.line) {
    return null;
  }

  const lineNumber = property.loc.start.line - 1;
  const [lineStart, lineEnd] = getLineBounds(text, lineNumber, lineStarts);
  const line = text.slice(lineStart, lineEnd);
  const indent = getIndent(line);

  if (property.loc.start.column !== indent.length) {
    return null;
  }

  const operatorSegment = text.slice(property.key.end, property.value.start);

  if (!operatorSegment.includes(':') || hasCommentMarker(operatorSegment)) {
    return null;
  }

  return {
    lineNumber,
    lineStart,
    lineEnd,
    indent,
    key: text.slice(lineStart + indent.length, property.key.end).trimEnd(),
    valueStart: property.value.start
  };
}

function alignObjectGroup(text: string, group: AlignableObjectProperty[]): TextChange[] {
  if (group.length === 0) {
    return [];
  }

  const maxKeyLength = group.reduce((maxLength, property) => Math.max(maxLength, property.key.length), 0);

  return group.map((property) => {
    const value = text.slice(property.valueStart, property.lineEnd);
    const padding = ' '.repeat(maxKeyLength - property.key.length + 1);

    return {
      start: property.lineStart,
      end: property.lineEnd,
      text: `${property.indent}${property.key}:${padding}${value}`
    };
  });
}

function splitConsecutiveGroups<T extends { lineNumber: number }>(items: T[]): T[][] {
  const groups: T[][] = [];

  for (const item of items) {
    const currentGroup = groups[groups.length - 1];
    const previousItem = currentGroup?.[currentGroup.length - 1];

    if (!currentGroup || !previousItem || item.lineNumber !== previousItem.lineNumber + 1) {
      groups.push([item]);
      continue;
    }

    currentGroup.push(item);
  }

  return groups;
}
