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

interface AlignableJsxAttribute {
  lineNumber: number;
  lineStart: number;
  lineEnd: number;
  indent: string;
  name: string;
  valueStart: number;
}

export function alignJsxProps(text: string, ast: AnyNode): string {
  const lineStarts = getLineStarts(text);
  const changes: TextChange[] = [];

  traverseAst(ast, (node) => {
    if (node.type !== 'JSXOpeningElement' || node.loc?.start.line === node.loc?.end.line || !Array.isArray(node.attributes)) {
      return;
    }

    const attributes = node.attributes
      .map((attribute: AnyNode) => toAlignableJsxAttribute(text, attribute, lineStarts))
      .filter((attribute): attribute is AlignableJsxAttribute => Boolean(attribute));

    for (const group of splitConsecutiveGroups(attributes)) {
      changes.push(...alignJsxGroup(text, group));
    }
  });

  return applyTextChanges(text, changes);
}

function toAlignableJsxAttribute(text: string, attribute: AnyNode, lineStarts: number[]): AlignableJsxAttribute | null {
  if (attribute.type !== 'JSXAttribute' || !attribute.value || !attribute.loc || !attribute.name) {
    return null;
  }

  if (attribute.loc.start.line !== attribute.value.loc?.start.line || attribute.name.loc?.end.line !== attribute.value.loc?.start.line) {
    return null;
  }

  const lineNumber = attribute.loc.start.line - 1;
  const [lineStart, lineEnd] = getLineBounds(text, lineNumber, lineStarts);
  const line = text.slice(lineStart, lineEnd);
  const indent = getIndent(line);

  if (attribute.loc.start.column !== indent.length) {
    return null;
  }

  const operatorSegment = text.slice(attribute.name.end, attribute.value.start);

  if (!operatorSegment.includes('=') || hasCommentMarker(operatorSegment)) {
    return null;
  }

  return {
    lineNumber,
    lineStart,
    lineEnd,
    indent,
    name: text.slice(lineStart + indent.length, attribute.name.end).trimEnd(),
    valueStart: attribute.value.start
  };
}

function alignJsxGroup(text: string, group: AlignableJsxAttribute[]): TextChange[] {
  if (group.length === 0) {
    return [];
  }

  const maxNameLength = group.reduce((maxLength, attribute) => Math.max(maxLength, attribute.name.length), 0);

  return group.map((attribute) => {
    const value = text.slice(attribute.valueStart, attribute.lineEnd);
    const padding = ' '.repeat(maxNameLength - attribute.name.length + 1);

    return {
      start: attribute.lineStart,
      end: attribute.lineEnd,
      text: `${attribute.indent}${attribute.name}${padding}= ${value}`
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
