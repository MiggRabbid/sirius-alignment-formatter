# Sirius Alignment Formatter

`Sirius Alignment Formatter` - форматтер VS Code для JavaScript, JSX, TypeScript и TSX. Он выравнивает импорты, enum, объявления переменных, object literal и JSX props, добавляет ожидаемые `;` и сохраняет остальной код максимально близко к исходному.

Форматтер использует `@babel/parser` для разбора кода и не использует Prettier как основной движок форматирования.

## Поддерживаемые языки

- JavaScript
- JavaScript React
- TypeScript
- TypeScript React

## Подключение

Чтобы использовать расширение как форматтер по умолчанию, добавьте настройки в `settings.json` VS Code:

```json
{
  "[javascript]": {
    "editor.defaultFormatter": "local.sirius-alignment-formatter"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "local.sirius-alignment-formatter"
  },
  "[typescript]": {
    "editor.defaultFormatter": "local.sirius-alignment-formatter"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "local.sirius-alignment-formatter"
  }
}
```

Для форматирования при сохранении включите стандартную настройку VS Code:

```json
{
  "editor.formatOnSave": true
}
```

Расширение работает через стандартную команду VS Code `Format Document`.

## Настройки

```json
{
  "siriusAlignmentFormatter.enable": true,
  "siriusAlignmentFormatter.importFromMinColumn": 40,
  "siriusAlignmentFormatter.importFromMaxColumn": 60,
  "siriusAlignmentFormatter.alignObjects": true,
  "siriusAlignmentFormatter.alignJsxProps": true
}
```

| Настройка | По умолчанию | Описание |
| --- | ---: | --- |
| `siriusAlignmentFormatter.enable` | `true` | Включает или выключает форматтер. |
| `siriusAlignmentFormatter.importFromMinColumn` | `40` | Минимальная колонка для `from` в import declarations. |
| `siriusAlignmentFormatter.importFromMaxColumn` | `60` | Максимальная колонка для `from`, после которой длинные named imports переводятся в многострочный вид. |
| `siriusAlignmentFormatter.alignObjects` | `true` | Выравнивает значения свойств в object literal по `:`. |
| `siriusAlignmentFormatter.alignJsxProps` | `true` | Выравнивает `=` у JSX props в многострочных opening elements. |

## Примеры форматирования

### Отступы

Табы и неполные отступы приводятся к сетке в 4 пробела.

До:

```ts
const item = {
	title:getTitle(),
  name: id,
}
```

После:

```ts
const item = {
    title: getTitle(),
    name:  id,
};
```

### Imports

Named imports нормализуются, все `import ... from ...` выравниваются до общей колонки `from`, а `;` добавляется автоматически.

До:

```ts
import {  Column, Row  } from '@sirius/ui-lib/src/@types/table'
import React from 'react'
import {useMemo, useState} from 'react'
```

После:

```ts
import {Column, Row}                    from '@sirius/ui-lib/src/@types/table';
import React                            from 'react';
import {useMemo, useState}              from 'react';
```

Если named import становится слишком длинным, он переводится в многострочный вид.

До:

```ts
import { getColTranslation, getCellAction, checkButtonWAction, navigateTo } from '@/blocks/Table/helpers'
import {  Column, Row  } from '@sirius/ui-lib/src/@types/table'
```

После:

```ts
import {
    getColTranslation,
    getCellAction,
    checkButtonWAction,
    navigateTo
}                                       from '@/blocks/Table/helpers';
import {Column, Row}                    from '@sirius/ui-lib/src/@types/table';
```

Side-effect imports тоже получают `;`.

До:

```ts
import './styles.css'
```

После:

```ts
import './styles.css';
```

### Enum

В последовательных однострочных enum members выравнивается знак `=`.

До:

```ts
enum ColumnTitle {
    id = 'ID',
    title='Title',
    siriusTmFrom   = 'Start',
}
```

После:

```ts
enum ColumnTitle {
    id           = 'ID',
    title        = 'Title',
    siriusTmFrom = 'Start',
}
```

### Variable declarations

В последовательных однострочных объявлениях переменных выравнивается знак `=`.

До:

```ts
const [allCols, setAllCols] = useState<Array<Column>>(getColsByTable(table));
const [rows, setRows] = useState<Array<Row>>(getRowsByTable(table));
const hasTable  =  table && 'cols' in table;
```

После:

```ts
const [allCols, setAllCols] = useState<Array<Column>>(getColsByTable(table));
const [rows, setRows]       = useState<Array<Row>>(getRowsByTable(table));
const hasTable              =  table && 'cols' in table;
```

### Object literal

В object literal выравнивается начало value после `:`.

До:

```ts
export const colMapper = () => ({
    title:getColTranslation(),
    name: id,
    bold  :BOLD_COLS.includes(id),
    sort,
})
```

После:

```ts
export const colMapper = () => ({
    title: getColTranslation(),
    name:  id,
    bold:  BOLD_COLS.includes(id),
    sort,
});
```

Shorthand properties, например `sort`, не меняются.

### JSX props

В многострочных JSX opening elements выравнивается `=`.

До:

```tsx
const view = (
    <Table
        {...tableProps}
        checkedRows={[]}
        cols = {cols}
        rows={rows}
        uischema={getUISchema(onRowActionByLink)}
        className={block}
        EmptyElement={EmptyElement}
        hardWidthDisabled
    />
)
```

После:

```tsx
const view = (
    <Table
        {...tableProps}
        checkedRows  = {[]}
        cols         = {cols}
        rows         = {rows}
        uischema     = {getUISchema(onRowActionByLink)}
        className    = {block}
        EmptyElement = {EmptyElement}
        hardWidthDisabled
    />
);
```

Spread props и boolean props без `=` не меняются.

### Semicolons

Форматтер добавляет пропущенные `;` для statement-узлов, где они ожидаются.

До:

```ts
const value = getValue()
export { value }
```

После:

```ts
const value = getValue();
export { value };
```

Если `;` уже стоит на следующей строке, он не дублируется.

## Ограничения текущей версии

- Форматтер намеренно не перепечатывает весь AST, чтобы сохранять комментарии и код вне поддержанных правил.
- Import declarations с import attributes/assertions или комментариями внутри самого import пропускаются.
- Выравнивание применяется только к безопасным однострочным enum members, object properties и JSX attributes.
- Variable declarations выравниваются только для последовательных однострочных объявлений с одинаковым отступом и одним declarator.
- Object methods, shorthand object properties, JSX spread props и boolean JSX props без `=` не меняются.
- Неподдержанные конструкции остаются без изменений.
- Исходный стиль переносов строк `\n` или `\r\n` сохраняется.
