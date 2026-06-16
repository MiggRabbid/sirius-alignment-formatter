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

interface AlignableTypeMember {
  lineNumber: number;
  lineStart: number;
  lineEnd: number;
  indent: string;
  key: string;
  typeStart: number;
}

export function alignTypeLiterals(text: string, ast: AnyNode): string {
  const lineStarts = getLineStarts(text);
  const changes: TextChange[] = [];

  traverseAst(ast, (node) => {
    const nodeMembers = getTypeMembers(node);

    if (!nodeMembers) {
      return;
    }

    const members = nodeMembers
      .map((member: AnyNode) => toAlignableTypeMember(text, member, lineStarts))
      .filter((member): member is AlignableTypeMember => Boolean(member));

    for (const group of splitConsecutiveGroups(members)) {
      changes.push(...alignTypeMemberGroup(text, group));
    }
  });

  return applyTextChanges(text, changes);
}

function getTypeMembers(node: AnyNode): AnyNode[] | null {
  if (node.type === 'TSTypeLiteral' && Array.isArray(node.members)) {
    return node.members;
  }

  if (node.type === 'TSInterfaceBody' && Array.isArray(node.body)) {
    return node.body;
  }

  return null;
}

function toAlignableTypeMember(text: string, member: AnyNode, lineStarts: number[]): AlignableTypeMember | null {
  if (member.type !== 'TSPropertySignature' || !member.key || !member.typeAnnotation || !member.loc) {
    return null;
  }

  const typeStart = member.typeAnnotation.typeAnnotation?.start;

  if (typeof member.key.end !== 'number' || typeof typeStart !== 'number') {
    return null;
  }

  if (member.loc.start.line !== member.loc.end.line || member.key.loc?.end.line !== member.loc.start.line) {
    return null;
  }

  const lineNumber = member.loc.start.line - 1;
  const [lineStart, lineEnd] = getLineBounds(text, lineNumber, lineStarts);
  const line = text.slice(lineStart, lineEnd);
  const indent = getIndent(line);

  if (member.loc.start.column !== indent.length) {
    return null;
  }

  const operatorSegment = text.slice(member.key.end, typeStart);
  const colonOffset = operatorSegment.indexOf(':');

  if (colonOffset === -1 || hasCommentMarker(operatorSegment)) {
    return null;
  }

  const colonIndex = member.key.end + colonOffset;

  return {
    lineNumber,
    lineStart,
    lineEnd,
    indent,
    key: text.slice(lineStart + indent.length, colonIndex).trimEnd(),
    typeStart
  };
}

function alignTypeMemberGroup(text: string, group: AlignableTypeMember[]): TextChange[] {
  if (group.length === 0) {
    return [];
  }

  const maxKeyLength = group.reduce((maxLength, member) => Math.max(maxLength, member.key.length), 0);

  return group.map((member) => {
    const type = text.slice(member.typeStart, member.lineEnd);
    const padding = ' '.repeat(maxKeyLength - member.key.length + 1);

    return {
      start: member.lineStart,
      end: member.lineEnd,
      text: `${member.indent}${member.key}:${padding}${type}`
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
