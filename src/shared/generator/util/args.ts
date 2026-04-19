export interface ParsedArgs {
    tables: string[];
    view?: boolean;
    api?: boolean;
    mock?: boolean;
    route?: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
    const args = argv.slice(2);
    
    // 解析 --tables 参数，支持 --tables=user,role 或 --tables user,role 格式
    let tablesArg: string | undefined;
    let tablesArgIndex = -1;
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--tables=')) {
            tablesArg = arg.replace('--tables=', '');
            tablesArgIndex = i;
            break;
        } else if (arg === '--tables' && i + 1 < args.length) {
            tablesArg = args[i + 1];
            tablesArgIndex = i;
            break;
        }
    }
    
    if (!tablesArg) {
        throw new Error('缺少 --tables 参数。用法: --tables=user,role 或 --tables user,role');
    }

    const tables = tablesArg.split(',').map(s => s.trim()).filter(Boolean);
    
    if (tables.length === 0) {
        throw new Error('--tables 参数不能为空');
    }

    // 解析选项参数
    const view = !args.includes('--no-view');
    const api = !args.includes('--no-api');
    const mock = !args.includes('--no-mock');
    const route = !args.includes('--no-route');

    return { tables, view, api, mock, route };
}
