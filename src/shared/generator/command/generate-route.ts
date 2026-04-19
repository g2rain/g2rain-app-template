import * as path from 'path';
import { loadTableInfos } from '../core/context';
import { updateRouteMap } from '../template/route';

export async function generateRoute(tables: string[]) {
    const infos = loadTableInfos(tables);
    const routeMapPath = path.resolve(
        process.cwd(),
        'src/views/route-map.ts',
    );

    updateRouteMap(infos, routeMapPath);

    console.log('✓ route-map.ts 已更新');
}
