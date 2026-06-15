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

interface AlignableEnumMember {
  lineNumber: number;
  lineStart: number;
  lineEnd: number;
  indent: string;
  key: string;
  valueStart: number;
}

export function alignEnums(text: string, ast: AnyNode): string {
  const lineStarts = getLineStarts(text);
  const changes: TextChange[] = [];

  traverseAst(ast, (node) => {
    if (node.type !== 'TSEnumDeclaration' || !Array.isArray(node.members)) {
      return;
    }

    const members = node.members
      .map((member: AnyNode) => toAlignableEnumMember(text, member, lineStarts))
      .filter((member): member is AlignableEnumMember => Boolean(member));

    for (const group of splitConsecutiveGroups(members)) {
      changes.push(...alignEnumGroup(text, group));
    }
  });

  return applyTextChanges(text, changes);
}

function toAlignableEnumMember(text: string, member: AnyNode, lineStarts: number[]): AlignableEnumMember | null {
  if (!member.initializer || !member.loc || member.loc.start.line !== member.loc.end.line) {
    return null;
  }

  if (!member.id || typeof member.id.end !== 'number' || typeof member.initializer.start !== 'number') {
    return null;
  }

  const lineNumber = member.loc.start.line - 1;
  const [lineStart, lineEnd] = getLineBounds(text, lineNumber, lineStarts);
  const line = text.slice(lineStart, lineEnd);
  const indent = getIndent(line);

  if (member.loc.start.column !== indent.length) {
    return null;
  }

  const operatorSegment = text.slice(member.id.end, member.initializer.start);

  if (!operatorSegment.includes('=') || hasCommentMarker(operatorSegment)) {
    return null;
  }

  return {
    lineNumber,
    lineStart,
    lineEnd,
    indent,
    key: text.slice(lineStart + indent.length, member.id.end).trimEnd(),
    valueStart: member.initializer.start
  };
}

function alignEnumGroup(text: string, group: AlignableEnumMember[]): TextChange[] {
  if (group.length === 0) {
    return [];
  }

  const maxKeyLength = group.reduce((maxLength, member) => Math.max(maxLength, member.key.length), 0);

  return group.map((member) => {
    const value = text.slice(member.valueStart, member.lineEnd);
    const padding = ' '.repeat(maxKeyLength - member.key.length + 1);

    return {
      start: member.lineStart,
      end: member.lineEnd,
      text: `${member.indent}${member.key}${padding}= ${value}`
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
