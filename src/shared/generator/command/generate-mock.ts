import * as fs from 'fs';
import * as path from 'path';
import { loadTableInfos } from '../core/context';
import { renderTemplate } from '../template/loader';

export async function generateMock(tables: string[]) {
    const infos = loadTableInfos(tables);
    const viewsDir = path.resolve(process.cwd(), 'src/views');

    for (const info of infos) {
        const dir = path.join(viewsDir, info.name);
        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(path.join(dir, 'mock.ts'), renderTemplate('mock', { table: info }));

        console.log(`✓ mock 已生成: ${info.name}`);
    }
}
