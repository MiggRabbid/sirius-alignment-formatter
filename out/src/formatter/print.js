"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEndOfLine = detectEndOfLine;
exports.normalizeEndOfLine = normalizeEndOfLine;
exports.restoreEndOfLine = restoreEndOfLine;
exports.applyTextChanges = applyTextChanges;
exports.getLineStarts = getLineStarts;
exports.getLineBounds = getLineBounds;
exports.getLineText = getLineText;
exports.getIndent = getIndent;
exports.hasCommentMarker = hasCommentMarker;
function detectEndOfLine(text) {
    const firstCrLf = text.indexOf('\r\n');
    const firstLf = text.indexOf('\n');
    if (firstCrLf === -1) {
        return '\n';
    }
    if (firstLf === -1) {
        return '\r\n';
    }
    return firstCrLf === firstLf - 1 ? '\r\n' : '\n';
}
function normalizeEndOfLine(text) {
    return text.replace(/\r\n/g, '\n');
}
function restoreEndOfLine(text, endOfLine) {
    return endOfLine === '\r\n' ? text.replace(/\n/g, '\r\n') : text;
}
function applyTextChanges(text, changes) {
    if (changes.length === 0) {
        return text;
    }
    const ordered = changes
        .filter((change) => change.start >= 0 && change.end >= change.start && change.end <= text.length)
        .sort((left, right) => {
        if (right.start !== left.start) {
            return right.start - left.start;
        }
        return right.end - left.end;
    });
    let result = text;
    let nextAllowedStart = text.length + 1;
    for (const change of ordered) {
        if (change.end > nextAllowedStart) {
            continue;
        }
        if (text.slice(change.start, change.end) === change.text) {
            nextAllowedStart = change.start;
            continue;
        }
        result = result.slice(0, change.start) + change.text + result.slice(change.end);
        nextAllowedStart = change.start;
    }
    return result;
}
function getLineStarts(text) {
    const starts = [0];
    for (let index = 0; index < text.length; index += 1) {
        if (text.charCodeAt(index) === 10) {
            starts.push(index + 1);
        }
    }
    return starts;
}
function getLineBounds(text, zeroBasedLine, lineStarts = getLineStarts(text)) {
    const start = lineStarts[zeroBasedLine] ?? text.length;
    const nextStart = lineStarts[zeroBasedLine + 1] ?? text.length;
    const end = nextStart > start && text.charCodeAt(nextStart - 1) === 10 ? nextStart - 1 : nextStart;
    return [start, end];
}
function getLineText(text, zeroBasedLine, lineStarts = getLineStarts(text)) {
    const [start, end] = getLineBounds(text, zeroBasedLine, lineStarts);
    return text.slice(start, end);
}
function getIndent(line) {
    return line.match(/^\s*/u)?.[0] ?? '';
}
function hasCommentMarker(text) {
    return text.includes('//') || text.includes('/*') || text.includes('*/');
}
