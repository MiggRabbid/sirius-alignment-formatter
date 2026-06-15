import type { AnyNode } from './parse';
import { traverseAst } from './parse';
import {
  applyTextChanges,
  getLineBounds,
  getLineStarts,
  hasCommentMarker,
  type TextChange
} from './print';

interface AlignableJsxAttribute {
  lineNumber: number;
  lineStart: number;
  lineEnd: number;
  prefix: string;
  name: string;
  valueStart: number;
}

interface JsxAttributeLine {
  lineNumber: number;
  lineStart: number;
  lineEnd: number;
  attributeStart: number;
  shouldAlignEqualSign: boolean;
}

export function alignJsxProps(text: string, ast: AnyNode): string {
  const lineStarts = getLineStarts(text);
  const changes: TextChange[] = [];

  traverseAst(ast, (node) => {
    if (node.type !== 'JSXOpeningElement' || node.loc?.start.line === node.loc?.end.line || !Array.isArray(node.attributes)) {
      return;
    }

    const propStartColumn = getPropStartColumn(node);
    const attributeLines = node.attributes
      .map((attribute: AnyNode) => toJsxAttributeLine(text, attribute, lineStarts))
      .filter((attribute): attribute is JsxAttributeLine => Boolean(attribute));
    const attributes = node.attributes
      .map((attribute: AnyNode) => toAlignableJsxAttribute(text, attribute, lineStarts, propStartColumn))
      .filter((attribute): attribute is AlignableJsxAttribute => Boolean(attribute));

    for (const group of splitConsecutiveGroups(attributes)) {
      changes.push(...alignJsxGroup(text, group));
    }

    if (propStartColumn !== null) {
      changes.push(...alignNonValuedJsxAttributeIndents(text, attributeLines, propStartColumn));
    }
  });

  return applyTextChanges(text, changes);
}

function getPropStartColumn(openingElement: AnyNode): number | null {
  const firstAttribute = Array.isArray(openingElement.attributes) ? openingElement.attributes[0] : null;

  if (!firstAttribute?.loc || firstAttribute.loc.start.line !== openingElement.loc?.start.line) {
    return null;
  }

  return firstAttribute.loc.start.column;
}

function toAlignableJsxAttribute(
  text: string,
  attribute: AnyNode,
  lineStarts: number[],
  propStartColumn: number | null
): AlignableJsxAttribute | null {
  if (attribute.type !== 'JSXAttribute' || !attribute.value || !attribute.loc || !attribute.name) {
    return null;
  }

  if (attribute.loc.start.line !== attribute.value.loc?.start.line || attribute.name.loc?.end.line !== attribute.value.loc?.start.line) {
    return null;
  }

  const lineNumber = attribute.loc.start.line - 1;
  const [lineStart, lineEnd] = getLineBounds(text, lineNumber, lineStarts);
  const prefix = propStartColumn === null || attribute.loc.start.column === propStartColumn
    ? text.slice(lineStart, attribute.name.start)
    : ' '.repeat(propStartColumn);

  const operatorSegment = text.slice(attribute.name.end, attribute.value.start);

  if (!operatorSegment.includes('=') || hasCommentMarker(operatorSegment)) {
    return null;
  }

  return {
    lineNumber,
    lineStart,
    lineEnd,
    prefix,
    name: text.slice(attribute.name.start, attribute.name.end).trimEnd(),
    valueStart: attribute.value.start
  };
}

function toJsxAttributeLine(text: string, attribute: AnyNode, lineStarts: number[]): JsxAttributeLine | null {
  if (!attribute.loc || typeof attribute.start !== 'number' || typeof attribute.end !== 'number') {
    return null;
  }

  if (attribute.loc.start.line !== attribute.loc.end.line) {
    return null;
  }

  const lineNumber = attribute.loc.start.line - 1;
  const [lineStart, lineEnd] = getLineBounds(text, lineNumber, lineStarts);

  return {
    lineNumber,
    lineStart,
    lineEnd,
    attributeStart: attribute.start,
    shouldAlignEqualSign: attribute.type === 'JSXAttribute' && Boolean(attribute.value)
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
      text: `${attribute.prefix}${attribute.name}${padding}= ${value}`
    };
  });
}

function alignNonValuedJsxAttributeIndents(
  text: string,
  attributes: JsxAttributeLine[],
  propStartColumn: number
): TextChange[] {
  const targetPrefix = ' '.repeat(propStartColumn);
  const changes: TextChange[] = [];

  for (const group of splitConsecutiveGroups(attributes)) {
    if (!group.some((attribute) => attribute.shouldAlignEqualSign)) {
      continue;
    }

    for (const attribute of group) {
      if (attribute.shouldAlignEqualSign) {
        continue;
      }

      const currentPrefix = text.slice(attribute.lineStart, attribute.attributeStart);

      if (currentPrefix === targetPrefix || currentPrefix.trim().length > 0) {
        continue;
      }

      changes.push({
        start: attribute.lineStart,
        end: attribute.lineEnd,
        text: `${targetPrefix}${text.slice(attribute.attributeStart, attribute.lineEnd)}`
      });
    }
  }

  return changes;
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
