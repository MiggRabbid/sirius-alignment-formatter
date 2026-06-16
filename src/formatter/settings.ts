export interface FormatterSettings {
  enable: boolean;
  importFromMinColumn: number;
  importFromMaxColumn: number;
  alignObjects: boolean;
  alignJsxProps: boolean;
}

export const DEFAULT_SETTINGS: FormatterSettings = {
  enable: true,
  importFromMinColumn: 40,
  importFromMaxColumn: 65,
  alignObjects: true,
  alignJsxProps: true
};

export function normalizeSettings(settings?: Partial<FormatterSettings>): FormatterSettings {
  const merged = {
    ...DEFAULT_SETTINGS,
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

function withoutUndefined(settings?: Partial<FormatterSettings>): Partial<FormatterSettings> {
  if (!settings) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined)
  ) as Partial<FormatterSettings>;
}
