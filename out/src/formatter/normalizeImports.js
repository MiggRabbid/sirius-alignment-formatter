"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectImportDeclarations = collectImportDeclarations;
exports.normalizeImportDeclaration = normalizeImportDeclaration;
const print_1 = require("./print");
function collectImportDeclarations(ast) {
    const body = ast.program?.body;
    if (!Array.isArray(body)) {
        return [];
    }
    return body.filter((node) => node.type === 'ImportDeclaration');
}
function normalizeImportDeclaration(node, text) {
    if (hasImportAttributes(node) || (0, print_1.hasCommentMarker)(text.slice(node.start, node.end))) {
        return null;
    }
    const sourceRaw = getSourceRaw(node);
    const specifiers = Array.isArray(node.specifiers) ? node.specifiers : [];
    if (specifiers.length === 0) {
        return {
            node,
            sourceRaw,
            prefix: '',
            namedSpecifiers: [],
            hasFrom: false,
            canMultiline: false,
            sideEffectStatement: `import ${sourceRaw};`
        };
    }
    const importKeyword = node.importKind === 'type' ? 'import type' : 'import';
    const defaultSpecifier = specifiers.find((specifier) => specifier.type === 'ImportDefaultSpecifier');
    const namespaceSpecifier = specifiers.find((specifier) => specifier.type === 'ImportNamespaceSpecifier');
    const namedSpecifiers = specifiers
        .filter((specifier) => specifier.type === 'ImportSpecifier')
        .map((specifier) => printImportSpecifier(specifier, node.importKind === 'type'));
    const prefixParts = [];
    if (defaultSpecifier) {
        prefixParts.push(getLocalName(defaultSpecifier));
    }
    if (namespaceSpecifier) {
        prefixParts.push(`* as ${getLocalName(namespaceSpecifier)}`);
    }
    if (namedSpecifiers.length > 0) {
        prefixParts.push(`{${namedSpecifiers.join(', ')}}`);
    }
    if (prefixParts.length === 0) {
        return null;
    }
    return {
        node,
        sourceRaw,
        prefix: `${importKeyword} ${prefixParts.join(', ')}`,
        namedSpecifiers,
        hasFrom: true,
        canMultiline: namedSpecifiers.length > 0
    };
}
function hasImportAttributes(node) {
    return Boolean((Array.isArray(node.attributes) && node.attributes.length > 0)
        || (Array.isArray(node.assertions) && node.assertions.length > 0));
}
function printImportSpecifier(specifier, declarationIsTypeOnly) {
    const importedName = getImportedName(specifier);
    const localName = getLocalName(specifier);
    const typePrefix = specifier.importKind === 'type' && !declarationIsTypeOnly ? 'type ' : '';
    if (!importedName || importedName === localName) {
        return `${typePrefix}${localName}`;
    }
    return `${typePrefix}${importedName} as ${localName}`;
}
function getImportedName(specifier) {
    const imported = specifier.imported;
    if (!imported) {
        return getLocalName(specifier);
    }
    if (typeof imported.name === 'string') {
        return imported.name;
    }
    if (typeof imported.value === 'string') {
        return JSON.stringify(imported.value);
    }
    return '';
}
function getLocalName(specifier) {
    return specifier.local?.name ?? '';
}
function getSourceRaw(node) {
    const raw = node.source?.extra?.raw;
    if (typeof raw === 'string' && raw.length > 0) {
        return raw;
    }
    const value = String(node.source?.value ?? '');
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
