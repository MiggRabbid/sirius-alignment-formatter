# Aligned Style Formatter

`Aligned Style Formatter` - расширение VS Code для форматирования JavaScript, JSX, TypeScript и TSX по строгим правилам выравнивания. Форматтер использует `@babel/parser` для разбора кода и не использует Prettier как основной движок форматирования.

## Что форматируется

- `import` с named imports нормализуются из `import {  A, B  }` в `import {A, B}`.
- Все `import ... from ...` выравниваются пробелами до `from`.
- Слишком длинные named imports переводятся в многострочный вид, после чего колонка `from` пересчитывается.
- Пропущенные `;` добавляются для statement-узлов, где они ожидаются.
- В `enum` выравнивается знак `=`.
- В object literal выравнивается начало value после `:`.
- В многострочных JSX-тегах выравнивается `=`.
- Shorthand object properties и boolean JSX props без `=` не меняются.
- Исходный стиль `\n` или `\r\n` сохраняется.

## Установка для разработки

```bash
npm install
npm run compile
```

После компиляции откройте проект в VS Code и нажмите `F5`. Запустится Extension Development Host, где расширение можно выбрать как форматтер.

## Default formatter

Добавьте настройки в `settings.json`:

```json
{
  "[javascript]": {
    "editor.defaultFormatter": "local.aligned-style-formatter"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "local.aligned-style-formatter"
  },
  "[typescript]": {
    "editor.defaultFormatter": "local.aligned-style-formatter"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "local.aligned-style-formatter"
  }
}
```

## Format on save

Для форматирования при сохранении включите стандартную настройку VS Code:

```json
{
  "editor.formatOnSave": true
}
```

Расширение регистрируется через `vscode.languages.registerDocumentFormattingEditProvider`, поэтому работает через стандартную команду `Format Document` и через `formatOnSave`.

## Настройки расширения

```json
{
  "alignedStyleFormatter.enable": true,
  "alignedStyleFormatter.importFromMinColumn": 40,
  "alignedStyleFormatter.importFromMaxColumn": 60,
  "alignedStyleFormatter.alignObjects": true,
  "alignedStyleFormatter.alignJsxProps": true
}
```

## Тесты

```bash
npm test
```

Тесты запускаются через `@vscode/test-cli`, `@vscode/test-electron` и Mocha. В suite есть golden-тесты для imports, enum, object literal, JSX props, idempotence, CRLF и смешанного TSX-файла.

## Публикация

Соберите VSIX:

```bash
npm run package
npx vsce package
```

Публикация:

```bash
npx vsce publish
```

## Ограничения первой версии

- Форматтер намеренно не перепечатывает весь AST, чтобы сохранять комментарии и исходный код вне поддержанных правил.
- Import declarations с import attributes/assertions или комментариями внутри самого import пропускаются.
- Выравнивание применяется только к безопасным однострочным enum members, object properties и JSX attributes.
- Неподдержанные конструкции не меняются.
