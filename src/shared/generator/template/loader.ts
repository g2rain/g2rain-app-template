import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as ejs from 'ejs';
import type { TableInfo } from '../core/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 加载并渲染 EJS 模板
 * @param templateName 模板文件名（不含扩展名）
 * @param data 模板数据
 * @returns 渲染后的字符串
 */
export function renderTemplate(templateName: string, data: { table: TableInfo }): string {
    const templatePath = path.resolve(__dirname, `${templateName}.ejs`);
    const template = fs.readFileSync(templatePath, 'utf-8');
    return ejs.render(template, data);
}

