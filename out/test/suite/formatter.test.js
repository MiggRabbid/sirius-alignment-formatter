"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const formatter_1 = require("../../src/formatter");
describe('Aligned Style Formatter', () => {
    it('formats and aligns imports', () => {
        const input = [
            "import {  Column, Row  } from '@sirius/ui-lib/src/@types/table'",
            "import React from 'react'",
            "import {useMemo, useState} from 'react'",
            ''
        ].join('\n');
        const expected = [
            importLine('import {Column, Row}', "'@sirius/ui-lib/src/@types/table'"),
            importLine('import React', "'react'"),
            importLine('import {useMemo, useState}', "'react'"),
            ''
        ].join('\n');
        strict_1.default.equal((0, formatter_1.formatCode)(input, undefined, 'typescriptreact'), expected);
    });
    it('expands too long named imports to multiline and recalculates from column', () => {
        const input = [
            "import { getColTranslation, getCellAction, checkButtonWAction, navigateTo } from '@/blocks/Table/helpers'",
            "import {  Column, Row  } from '@sirius/ui-lib/src/@types/table'",
            ''
        ].join('\n');
        const expected = [
            'import {',
            '    getColTranslation,',
            '    getCellAction,',
            '    checkButtonWAction,',
            '    navigateTo',
            `}${' '.repeat(39)}from '@/blocks/Table/helpers';`,
            importLine('import {Column, Row}', "'@sirius/ui-lib/src/@types/table'"),
            ''
        ].join('\n');
        strict_1.default.equal((0, formatter_1.formatCode)(input, undefined, 'typescriptreact'), expected);
    });
    it('aligns enum members', () => {
        const input = [
            'enum ColumnTitle {',
            "    id = 'ID',",
            "    title='Title',",
            "    siriusTmFrom   = 'Start',",
            '}',
            ''
        ].join('\n');
        const expected = [
            'enum ColumnTitle {',
            "    id           = 'ID',",
            "    title        = 'Title',",
            "    siriusTmFrom = 'Start',",
            '}',
            ''
        ].join('\n');
        strict_1.default.equal((0, formatter_1.formatCode)(input, undefined, 'typescript'), expected);
    });
    it('aligns object literal properties and keeps shorthand properties', () => {
        const input = [
            'export const colMapper = () => ({',
            '    title:getColTranslation(),',
            '    name: id,',
            '    bold  :BOLD_COLS.includes(id),',
            '    sort,',
            '})',
            ''
        ].join('\n');
        const expected = [
            'export const colMapper = () => ({',
            '    title: getColTranslation(),',
            '    name:  id,',
            '    bold:  BOLD_COLS.includes(id),',
            '    sort,',
            '});',
            ''
        ].join('\n');
        strict_1.default.equal((0, formatter_1.formatCode)(input, undefined, 'typescript'), expected);
    });
    it('aligns JSX props in multiline opening tags', () => {
        const input = [
            'const view = (',
            '    <Table',
            '        {...tableProps}',
            '        checkedRows={[]}',
            '        cols = {cols}',
            '        rows={rows}',
            '        uischema={getUISchema(onRowActionByLink)}',
            '        className={block}',
            '        EmptyElement={EmptyElement}',
            '        hardWidthDisabled',
            '    />',
            ')',
            ''
        ].join('\n');
        const expected = [
            'const view = (',
            '    <Table',
            '        {...tableProps}',
            '        checkedRows  = {[]}',
            '        cols         = {cols}',
            '        rows         = {rows}',
            '        uischema     = {getUISchema(onRowActionByLink)}',
            '        className    = {block}',
            '        EmptyElement = {EmptyElement}',
            '        hardWidthDisabled',
            '    />',
            ');',
            ''
        ].join('\n');
        strict_1.default.equal((0, formatter_1.formatCode)(input, undefined, 'typescriptreact'), expected);
    });
    it('is idempotent', () => {
        const formatted = [
            importLine('import {Column, Row}', "'@sirius/ui-lib/src/@types/table'"),
            '',
            'enum ColumnTitle {',
            "    id    = 'ID',",
            "    title = 'Title',",
            '}',
            '',
            'const value = {',
            '    title: getTitle(),',
            '    name:  id,',
            '};',
            ''
        ].join('\n');
        strict_1.default.equal((0, formatter_1.formatCode)((0, formatter_1.formatCode)(formatted, undefined, 'typescriptreact'), undefined, 'typescriptreact'), formatted);
    });
    it('formats a mixed TSX file', () => {
        const input = [
            "import { getColTranslation, getCellAction, checkButtonWAction, navigateTo } from '@/blocks/Table/helpers'",
            "import {  Column, Row  } from '@sirius/ui-lib/src/@types/table'",
            '',
            'enum ColumnTitle {',
            "    id = 'ID',",
            "    title='Title',",
            "    siriusTmFrom   = 'Start',",
            '}',
            '',
            'export const colMapper = ({id, sort}: Spec.Office.Activity.Column): Column => ({',
            '    title:getColTranslation() ?? ColumnTitle[id as keyof typeof ColumnTitle] ?? id,',
            '    name: id,',
            '    bold  :BOLD_COLS.includes(id),',
            '    sort,',
            '})',
            '',
            'export const TableView = () => (',
            '    <Table',
            '        cols={cols}',
            '        rows={rows}',
            '        EmptyElement={EmptyElement}',
            '        hardWidthDisabled',
            '    />',
            ')',
            ''
        ].join('\n');
        const expected = [
            'import {',
            '    getColTranslation,',
            '    getCellAction,',
            '    checkButtonWAction,',
            '    navigateTo',
            `}${' '.repeat(39)}from '@/blocks/Table/helpers';`,
            importLine('import {Column, Row}', "'@sirius/ui-lib/src/@types/table'"),
            '',
            'enum ColumnTitle {',
            "    id           = 'ID',",
            "    title        = 'Title',",
            "    siriusTmFrom = 'Start',",
            '}',
            '',
            'export const colMapper = ({id, sort}: Spec.Office.Activity.Column): Column => ({',
            '    title: getColTranslation() ?? ColumnTitle[id as keyof typeof ColumnTitle] ?? id,',
            '    name:  id,',
            '    bold:  BOLD_COLS.includes(id),',
            '    sort,',
            '});',
            '',
            'export const TableView = () => (',
            '    <Table',
            '        cols         = {cols}',
            '        rows         = {rows}',
            '        EmptyElement = {EmptyElement}',
            '        hardWidthDisabled',
            '    />',
            ');',
            ''
        ].join('\n');
        strict_1.default.equal((0, formatter_1.formatCode)(input, undefined, 'typescriptreact'), expected);
    });
    it('preserves CRLF line endings', () => {
        const input = [
            "import {  Column, Row  } from '@sirius/ui-lib/src/@types/table'",
            'const item = {',
            '    title:getTitle(),',
            '    name: id,',
            '}',
            ''
        ].join('\r\n');
        const expected = [
            importLine('import {Column, Row}', "'@sirius/ui-lib/src/@types/table'"),
            'const item = {',
            '    title: getTitle(),',
            '    name:  id,',
            '};',
            ''
        ].join('\r\n');
        strict_1.default.equal((0, formatter_1.formatCode)(input, undefined, 'typescript'), expected);
    });
});
function importLine(prefix, source) {
    return `${prefix}${' '.repeat(40 - prefix.length)}from ${source};`;
}
