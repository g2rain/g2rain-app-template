import * as fs from 'fs';
import * as path from 'path';
import { parseTable } from './parse-table';
import type { TableInfo } from './types';

export function loadTableInfos(tables: string[]): TableInfo[] {
    const projectRoot = path.resolve(process.cwd());
    const sqlPath = path.join(projectRoot, 'src/shared/generator/database.sql');

    const sql = fs.readFileSync(sqlPath, 'utf-8');

    return tables.map(table => {
        console.log(`→ 解析表 ${table}`);
        return parseTable(sql, table);
    });
}