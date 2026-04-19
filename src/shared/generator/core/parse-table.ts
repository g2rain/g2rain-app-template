import type { TableInfo, TableColumn } from './types';

export function parseTable(sql: string, tableName: string): TableInfo {
    const lines = sql.split('\n').map(l => l.trim()).filter(Boolean);

    const columns: TableColumn[] = [];
    let inColumns = false;
    const normalized = tableName.toLowerCase();

    for (const line of lines) {
        // 支持两种 DDL 风格：
        // 1) CREATE TABLE `space` (...)
        // 2) CREATE TABLE space (...)
        // 以及可选 IF NOT EXISTS
        const createMatch = line.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i);
        if (createMatch && createMatch[1]?.toLowerCase() === normalized) {
            inColumns = true;
            continue;
        }

        if (inColumns) {
            // 到达约束/索引或表定义结束时停止
            if (
                line.startsWith('PRIMARY KEY') ||
                line.startsWith('UNIQUE KEY') ||
                line.startsWith('UNIQUE INDEX') ||
                line.startsWith('KEY') ||
                line.startsWith('INDEX') ||
                line.startsWith(') ENGINE') ||
                line.startsWith(');') ||
                line === ')'
            ) {
                break;
            }

            const match = line.match(
                // 列名支持可选反引号；类型支持如 VARCHAR(128)、TIMESTAMP 等
                /^`?(\w+)`?\s+(\w+(?:\([^)]+\))?)\s*(.*?)(?:COMMENT\s+['"](.*?)['"])?\s*,?$/i,
            );

            if (!match) continue;

            const [, name, sqlType, rest, comment] = match;
            const camelName = snakeToCamel(name);
            // 允许 DEFAULT NULL 的列被识别为可空；NOT NULL 明确为不可空
            const upperRest = rest.toUpperCase();
            const nullable =
                (!upperRest.includes('NOT NULL') && upperRest.includes('NULL')) ||
                upperRest.includes('DEFAULT NULL');

            const isBaseField = ['id', 'create_time', 'update_time', 'version'].includes(
                name.toLowerCase(),
            );
            const isDeleteFlag = name.toLowerCase().includes('delete_flag');

            let tsType = 'string';
            if (sqlType.toLowerCase().includes('int')) tsType = 'number';
            if (sqlType.toLowerCase().includes('tinyint(1)') || isDeleteFlag) {
                tsType = 'boolean';
            }

            columns.push({
                name,
                camelName,
                type: tsType,
                nullable,
                comment: comment || '',
                isBaseField,
                isDeleteFlag,
            });
        }
    }

    const baseColumns = columns.filter(c => c.isBaseField);
    const businessColumns = columns.filter(c => !c.isBaseField);

    // 规范化表名：全部使用小写字母，避免大小写混用导致生成结果不一致
    const normalizedTableName = tableName.toLowerCase();

    const camelName = snakeToPascal(normalizedTableName);
    // 模块目录名与 linkPath / API 前缀一致：小写下划线表名
    const moduleName = normalizedTableName;

    return {
        name: moduleName,
        camelName,
        routePath: `/${normalizedTableName}`,
        routeName: camelName,
        title: getTitleFromComment(
            columns.find(c => c.name === 'name')?.comment || normalizedTableName,
        ),
        columns,
        baseColumns,
        businessColumns,
    };
}

function snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

function snakeToPascal(str: string): string {
    const c = snakeToCamel(str);
    return c.charAt(0).toUpperCase() + c.slice(1);
}

function getTitleFromComment(comment: string): string {
    const m = comment.match(/[\u4e00-\u9fa5]+/);
    return m ? m[0] : comment;
}
