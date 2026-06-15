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
        const propStartColumn = getPropStartColumn(node);
        const attributeLines = node.attributes
            .map((attribute) => toJsxAttributeLine(text, attribute, lineStarts))
            .filter((attribute) => Boolean(attribute));
        const attributes = node.attributes
            .map((attribute) => toAlignableJsxAttribute(text, attribute, lineStarts, propStartColumn))
            .filter((attribute) => Boolean(attribute));
        for (const group of splitConsecutiveGroups(attributes)) {
            changes.push(...alignJsxGroup(text, group));
        }
        if (propStartColumn !== null) {
            changes.push(...alignNonValuedJsxAttributeIndents(text, attributeLines, propStartColumn));
        }
    });
    return (0, print_1.applyTextChanges)(text, changes);
}
function getPropStartColumn(openingElement) {
    const firstAttribute = Array.isArray(openingElement.attributes) ? openingElement.attributes[0] : null;
    if (!firstAttribute?.loc || firstAttribute.loc.start.line !== openingElement.loc?.start.line) {
        return null;
    }
    return firstAttribute.loc.start.column;
}
function toAlignableJsxAttribute(text, attribute, lineStarts, propStartColumn) {
    if (attribute.type !== 'JSXAttribute' || !attribute.value || !attribute.loc || !attribute.name) {
        return null;
    }
    if (attribute.loc.start.line !== attribute.value.loc?.start.line || attribute.name.loc?.end.line !== attribute.value.loc?.start.line) {
        return null;
    }
    const lineNumber = attribute.loc.start.line - 1;
    const [lineStart, lineEnd] = (0, print_1.getLineBounds)(text, lineNumber, lineStarts);
    const prefix = propStartColumn === null || attribute.loc.start.column === propStartColumn
        ? text.slice(lineStart, attribute.name.start)
        : ' '.repeat(propStartColumn);
    const operatorSegment = text.slice(attribute.name.end, attribute.value.start);
    if (!operatorSegment.includes('=') || (0, print_1.hasCommentMarker)(operatorSegment)) {
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
function toJsxAttributeLine(text, attribute, lineStarts) {
    if (!attribute.loc || typeof attribute.start !== 'number' || typeof attribute.end !== 'number') {
        return null;
    }
    if (attribute.loc.start.line !== attribute.loc.end.line) {
        return null;
    }
    const lineNumber = attribute.loc.start.line - 1;
    const [lineStart, lineEnd] = (0, print_1.getLineBounds)(text, lineNumber, lineStarts);
    return {
        lineNumber,
        lineStart,
        lineEnd,
        attributeStart: attribute.start,
        shouldAlignEqualSign: attribute.type === 'JSXAttribute' && Boolean(attribute.value)
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
            text: `${attribute.prefix}${attribute.name}${padding}= ${value}`
        };
    });
}
function alignNonValuedJsxAttributeIndents(text, attributes, propStartColumn) {
    const targetPrefix = ' '.repeat(propStartColumn);
    const changes = [];
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
