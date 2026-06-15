"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSemicolons = ensureSemicolons;
const parse_1 = require("./parse");
const print_1 = require("./print");
function ensureSemicolons(text, ast) {
    const changes = [];
    (0, parse_1.traverseAst)(ast, (node, parent) => {
        if (!shouldEndWithSemicolon(node, parent) || hasSemicolon(text, node.end)) {
            return;
        }
        changes.push({
            start: node.end,
            end: node.end,
            text: ';'
        });
    });
    return (0, print_1.applyTextChanges)(text, changes);
}
function shouldEndWithSemicolon(node, parent) {
    switch (node.type) {
        case 'ImportDeclaration':
        case 'ExpressionStatement':
        case 'ReturnStatement':
        case 'ThrowStatement':
        case 'BreakStatement':
        case 'ContinueStatement':
        case 'DebuggerStatement':
        case 'DoWhileStatement':
        case 'TSTypeAliasDeclaration':
        case 'ClassProperty':
        case 'ClassPrivateProperty':
        case 'PropertyDefinition':
        case 'ClassAccessorProperty':
            return true;
        case 'VariableDeclaration':
            return !isForHeaderDeclaration(node, parent) && parent?.type !== 'ExportNamedDeclaration';
        case 'ExportNamedDeclaration':
            return shouldExportNamedDeclarationEndWithSemicolon(node);
        case 'ExportDefaultDeclaration':
            return shouldExportDefaultDeclarationEndWithSemicolon(node);
        case 'ExportAllDeclaration':
            return true;
        default:
            return false;
    }
}
function shouldExportNamedDeclarationEndWithSemicolon(node) {
    if (node.source || (Array.isArray(node.specifiers) && node.specifiers.length > 0)) {
        return true;
    }
    const declarationType = node.declaration?.type;
    return declarationType === 'VariableDeclaration'
        || declarationType === 'TSTypeAliasDeclaration'
        || declarationType === 'TSDeclareFunction';
}
function shouldExportDefaultDeclarationEndWithSemicolon(node) {
    const declarationType = node.declaration?.type;
    return declarationType !== 'FunctionDeclaration'
        && declarationType !== 'ClassDeclaration'
        && declarationType !== 'TSInterfaceDeclaration';
}
function isForHeaderDeclaration(node, parent) {
    if (!parent) {
        return false;
    }
    return (parent.type === 'ForStatement' && parent.init === node)
        || (parent.type === 'ForInStatement' && parent.left === node)
        || (parent.type === 'ForOfStatement' && parent.left === node);
}
function hasSemicolon(text, end) {
    if (text[end - 1] === ';') {
        return true;
    }
    let index = end;
    while (index < text.length && /\s/u.test(text[index])) {
        index += 1;
    }
    return text[index] === ';';
}
