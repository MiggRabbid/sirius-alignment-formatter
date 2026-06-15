"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alignObjects = alignObjects;
const parse_1 = require("./parse");
const print_1 = require("./print");
function alignObjects(text, ast) {
    const lineStarts = (0, print_1.getLineStarts)(text);
    const changes = [];
    (0, parse_1.traverseAst)(ast, (node) => {
        if (node.type !== 'ObjectExpression' || !Array.isArray(node.properties)) {
            return;
        }
        const properties = node.properties
            .map((property) => toAlignableObjectProperty(text, property, lineStarts))
            .filter((property) => Boolean(property));
        for (const group of splitConsecutiveGroups(properties)) {
            changes.push(...alignObjectGroup(text, group));
        }
    });
    return (0, print_1.applyTextChanges)(text, changes);
}
function toAlignableObjectProperty(text, property, lineStarts) {
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
    const [lineStart, lineEnd] = (0, print_1.getLineBounds)(text, lineNumber, lineStarts);
    const line = text.slice(lineStart, lineEnd);
    const indent = (0, print_1.getIndent)(line);
    if (property.loc.start.column !== indent.length) {
        return null;
    }
    const operatorSegment = text.slice(property.key.end, property.value.start);
    if (!operatorSegment.includes(':') || (0, print_1.hasCommentMarker)(operatorSegment)) {
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
function alignObjectGroup(text, group) {
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
