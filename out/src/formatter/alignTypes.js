"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alignTypeLiterals = alignTypeLiterals;
const parse_1 = require("./parse");
const print_1 = require("./print");
function alignTypeLiterals(text, ast) {
    const lineStarts = (0, print_1.getLineStarts)(text);
    const changes = [];
    (0, parse_1.traverseAst)(ast, (node) => {
        const nodeMembers = getTypeMembers(node);
        if (!nodeMembers) {
            return;
        }
        const members = nodeMembers
            .map((member) => toAlignableTypeMember(text, member, lineStarts))
            .filter((member) => Boolean(member));
        for (const group of splitConsecutiveGroups(members)) {
            changes.push(...alignTypeMemberGroup(text, group));
        }
    });
    return (0, print_1.applyTextChanges)(text, changes);
}
function getTypeMembers(node) {
    if (node.type === 'TSTypeLiteral' && Array.isArray(node.members)) {
        return node.members;
    }
    if (node.type === 'TSInterfaceBody' && Array.isArray(node.body)) {
        return node.body;
    }
    return null;
}
function toAlignableTypeMember(text, member, lineStarts) {
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
    const [lineStart, lineEnd] = (0, print_1.getLineBounds)(text, lineNumber, lineStarts);
    const line = text.slice(lineStart, lineEnd);
    const indent = (0, print_1.getIndent)(line);
    if (member.loc.start.column !== indent.length) {
        return null;
    }
    const operatorSegment = text.slice(member.key.end, typeStart);
    const colonOffset = operatorSegment.indexOf(':');
    if (colonOffset === -1 || (0, print_1.hasCommentMarker)(operatorSegment)) {
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
function alignTypeMemberGroup(text, group) {
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
function splitConsecutiveGroups(items) {
    const groups = [];
    for (const item of items) {
        const currentGroup = groups[groups.length - 1];
        const previousItem = currentGroup?.[currentGroup.length - 1];
        if (!currentGroup
            || !previousItem
            || item.lineNumber !== previousItem.lineNumber + 1
            || item.indent !== previousItem.indent) {
            groups.push([item]);
            continue;
        }
        currentGroup.push(item);
    }
    return groups;
}
