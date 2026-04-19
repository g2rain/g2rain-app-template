// cli.ts
import { generateCode } from './index';
import { parseArgs } from './util/args';

async function main() {
    try {
        const args = parseArgs(process.argv);
        
        console.log(`\n🚀 开始生成代码...`);
        console.log(`📋 表名: ${args.tables.join(', ')}`);
        console.log(`📦 选项: view=${args.view}, api=${args.api}, mock=${args.mock}, route=${args.route}\n`);

        await generateCode(args.tables, {
            view: args.view,
            api: args.api,
            mock: args.mock,
            route: args.route,
        });

        console.log('\n✅ 代码生成完成！');
    } catch (err: any) {
        console.error('\n❌ 执行失败:', err.message);
        process.exit(1);
    }
}

main();