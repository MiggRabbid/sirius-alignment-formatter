"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const formatter_1 = require("./formatter");
const settings_1 = require("./formatter/settings");
const SUPPORTED_LANGUAGES = [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact'
];
function activate(context) {
    const provider = {
        provideDocumentFormattingEdits(document) {
            const settings = readFormatterSettings();
            if (!settings.enable || !isSupportedLanguage(document.languageId)) {
                return [];
            }
            const source = document.getText();
            const formatted = (0, formatter_1.formatCode)(source, settings, document.languageId);
            if (formatted === source) {
                return [];
            }
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(source.length));
            return [vscode.TextEdit.replace(fullRange, formatted)];
        }
    };
    for (const language of SUPPORTED_LANGUAGES) {
        context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ language }, provider));
    }
}
function deactivate() {
    // VS Code disposes registered providers through extension subscriptions.
}
function readFormatterSettings() {
    const config = vscode.workspace.getConfiguration('alignedStyleFormatter');
    return (0, settings_1.normalizeSettings)({
        enable: config.get('enable'),
        importFromMinColumn: config.get('importFromMinColumn'),
        importFromMaxColumn: config.get('importFromMaxColumn'),
        alignObjects: config.get('alignObjects'),
        alignJsxProps: config.get('alignJsxProps')
    });
}
function isSupportedLanguage(languageId) {
    return SUPPORTED_LANGUAGES.some((language) => language === languageId);
}
