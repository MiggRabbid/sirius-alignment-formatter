"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alignEnums = alignEnums;
const parse_1 = require("./parse");
const print_1 = require("./print");
function alignEnums(text, ast) {
    const lineStarts = (0, print_1.getLineStarts)(text);
    const changes = [];
    (0, parse_1.traverseAst)(ast, (node) => {
        if (node.type !== 'TSEnumDeclaration' || !Array.isArray(node.members)) {
            return;
        }
        const members = node.members
            .map((member) => toAlignableEnumMember(text, member, lineStarts))
            .filter((member) => Boolean(member));
        for (const group of splitConsecutiveGroups(members)) {
            changes.push(...alignEnumGroup(text, group));
        }
    });
    return (0, print_1.applyTextChanges)(text, changes);
}
function toAlignableEnumMember(text, member, lineStarts) {
    if (!member.initializer || !member.loc || member.loc.start.line !== member.loc.end.line) {
        return null;
    }
    if (!member.id || typeof member.id.end !== 'number' || typeof member.initializer.start !== 'number') {
        return null;
    }
    const lineNumber = member.loc.start.line - 1;
    const [lineStart, lineEnd] = (0, print_1.getLineBounds)(text, lineNumber, lineStarts);
    const line = text.slice(lineStart, lineEnd);
    const indent = (0, print_1.getIndent)(line);
    if (member.loc.start.column !== indent.length) {
        return null;
    }
    const operatorSegment = text.slice(member.id.end, member.initializer.start);
    if (!operatorSegment.includes('=') || (0, print_1.hasCommentMarker)(operatorSegment)) {
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
function alignEnumGroup(text, group) {
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
function splitConsecutiveGroups(items) {
    const groups = [];
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
