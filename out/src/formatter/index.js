"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCode = formatCode;
const alignEnum_1 = require("./alignEnum");
const alignJsx_1 = require("./alignJsx");
const alignObject_1 = require("./alignObject");
const alignVariables_1 = require("./alignVariables");
const importLayout_1 = require("./importLayout");
const indentation_1 = require("./indentation");
const parse_1 = require("./parse");
const print_1 = require("./print");
const semicolons_1 = require("./semicolons");
const settings_1 = require("./settings");
function formatCode(source, settings, languageId = 'typescriptreact') {
    const normalizedSettings = (0, settings_1.normalizeSettings)(settings);
    if (!normalizedSettings.enable || source.length === 0) {
        return source;
    }
    const endOfLine = (0, print_1.detectEndOfLine)(source);
    const originalText = (0, print_1.normalizeEndOfLine)(source);
    const initialParseResult = safeParse(originalText, languageId);
    if (!initialParseResult) {
        return source;
    }
    let currentText = originalText;
    let parseResult = initialParseResult;
    for (const pass of getFormatterPasses(normalizedSettings)) {
        const nextText = pass(currentText, parseResult, normalizedSettings);
        if (nextText === currentText) {
            continue;
        }
        const nextParseResult = safeParse(nextText, languageId);
        if (!nextParseResult) {
            continue;
        }
        currentText = nextText;
        parseResult = nextParseResult;
    }
    return (0, print_1.restoreEndOfLine)(currentText, endOfLine);
}
function getFormatterPasses(settings) {
    const passes = [
        (text) => (0, indentation_1.formatIndentation)(text),
        (text, parseResult) => (0, importLayout_1.formatImports)(text, parseResult.ast, settings),
        (text, parseResult) => (0, alignEnum_1.alignEnums)(text, parseResult.ast),
        (text, parseResult) => (0, alignVariables_1.alignVariables)(text, parseResult.ast)
    ];
    if (settings.alignObjects) {
        passes.push((text, parseResult) => (0, alignObject_1.alignObjects)(text, parseResult.ast));
    }
    if (settings.alignJsxProps) {
        passes.push((text, parseResult) => (0, alignJsx_1.alignJsxProps)(text, parseResult.ast));
    }
    passes.push((text, parseResult) => (0, semicolons_1.ensureSemicolons)(text, parseResult.ast));
    return passes;
}
function safeParse(text, languageId) {
    try {
        return (0, parse_1.parseCode)(text, languageId);
    }
    catch {
        return null;
    }
}
