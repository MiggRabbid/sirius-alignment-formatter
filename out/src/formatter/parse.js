"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCode = parseCode;
exports.traverseAst = traverseAst;
const parser_1 = require("@babel/parser");
function parseCode(text, languageId = 'typescriptreact') {
    const plugins = [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'dynamicImport',
        'importAttributes',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'explicitResourceManagement'
    ];
    const ast = (0, parser_1.parse)(text, {
        sourceType: 'module',
        allowAwaitOutsideFunction: true,
        allowImportExportEverywhere: true,
        errorRecovery: false,
        attachComment: true,
        ranges: true,
        tokens: true,
        plugins
    });
    void languageId;
    return {
        ast: ast,
        tokens: (ast.tokens ?? [])
    };
}
function traverseAst(node, visitor, parent = null) {
    if (!node || typeof node !== 'object') {
        return;
    }
    visitor(node, parent);
    for (const key of Object.keys(node)) {
        if (isMetadataKey(key)) {
            continue;
        }
        const value = node[key];
        if (Array.isArray(value)) {
            for (const child of value) {
                if (isNode(child)) {
                    traverseAst(child, visitor, node);
                }
            }
            continue;
        }
        if (isNode(value)) {
            traverseAst(value, visitor, node);
        }
    }
}
function isMetadataKey(key) {
    return key === 'loc'
        || key === 'range'
        || key === 'start'
        || key === 'end'
        || key === 'tokens'
        || key === 'comments'
        || key === 'leadingComments'
        || key === 'innerComments'
        || key === 'trailingComments'
        || key === 'extra';
}
function isNode(value) {
    return Boolean(value)
        && typeof value === 'object'
        && typeof value.type === 'string'
        && typeof value.start === 'number'
        && typeof value.end === 'number';
}
