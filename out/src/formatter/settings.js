"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = void 0;
exports.normalizeSettings = normalizeSettings;
exports.DEFAULT_SETTINGS = {
    enable: true,
    importFromMinColumn: 40,
    importFromMaxColumn: 65,
    alignObjects: true,
    alignJsxProps: true
};
function normalizeSettings(settings) {
    const merged = {
        ...exports.DEFAULT_SETTINGS,
        ...withoutUndefined(settings)
    };
    const importFromMinColumn = Math.max(1, Math.floor(merged.importFromMinColumn));
    const importFromMaxColumn = Math.max(importFromMinColumn, Math.floor(merged.importFromMaxColumn));
    return {
        enable: Boolean(merged.enable),
        importFromMinColumn,
        importFromMaxColumn,
        alignObjects: Boolean(merged.alignObjects),
        alignJsxProps: Boolean(merged.alignJsxProps)
    };
}
function withoutUndefined(settings) {
    if (!settings) {
        return {};
    }
    return Object.fromEntries(Object.entries(settings).filter(([, value]) => value !== undefined));
}
