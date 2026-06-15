# Development

Документация для разработки и публикации расширения.

## Установка для разработки

```bash
npm install
npm run compile
```

После компиляции откройте проект в VS Code и нажмите `F5`. Запустится Extension Development Host, где расширение можно выбрать как форматтер.

## Тесты

```bash
npm test
```

Тесты запускаются через `@vscode/test-cli`, `@vscode/test-electron` и Mocha. В suite есть golden-тесты для imports, enum, object literal, JSX props, idempotence, CRLF и смешанного TSX-файла.

## Сборка VSIX

```bash
npm run package
npx vsce package
```

## Публикация

```bash
npx vsce publish
```
