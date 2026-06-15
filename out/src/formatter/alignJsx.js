"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alignJsxProps = alignJsxProps;
const parse_1 = require("./parse");
const print_1 = require("./print");
function alignJsxProps(text, ast) {
    const lineStarts = (0, print_1.getLineStarts)(text);
    const changes = [];
    (0, parse_1.traverseAst)(ast, (node) => {
        if (node.type !== 'JSXOpeningElement' || node.loc?.start.line === node.loc?.end.line || !Array.isArray(node.attributes)) {
            return;
        }
        const attributes = node.attributes
            .map((attribute) => toAlignableJsxAttribute(text, attribute, lineStarts))
            .filter((attribute) => Boolean(attribute));
        for (const group of splitConsecutiveGroups(attributes)) {
            changes.push(...alignJsxGroup(text, group));
        }
    });
    return (0, print_1.applyTextChanges)(text, changes);
}
function toAlignableJsxAttribute(text, attribute, lineStarts) {
    if (attribute.type !== 'JSXAttribute' || !attribute.value || !attribute.loc || !attribute.name) {
        return null;
    }
    if (attribute.loc.start.line !== attribute.value.loc?.start.line || attribute.name.loc?.end.line !== attribute.value.loc?.start.line) {
        return null;
    }
    const lineNumber = attribute.loc.start.line - 1;
    const [lineStart, lineEnd] = (0, print_1.getLineBounds)(text, lineNumber, lineStarts);
    const line = text.slice(lineStart, lineEnd);
    const indent = (0, print_1.getIndent)(line);
    if (attribute.loc.start.column !== indent.length) {
        return null;
    }
    const operatorSegment = text.slice(attribute.name.end, attribute.value.start);
    if (!operatorSegment.includes('=') || (0, print_1.hasCommentMarker)(operatorSegment)) {
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
function alignJsxGroup(text, group) {
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
