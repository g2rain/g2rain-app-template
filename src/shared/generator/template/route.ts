import { Project, SyntaxKind } from 'ts-morph';
import type { TableInfo } from '../core/types';

export function updateRouteMap(tables: TableInfo[], routeMapPath: string) {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(routeMapPath);

    for (const table of tables) {
        const routePath = table.routePath;
        const routeName = table.routeName;
        const title = table.title;
        const viewPath = `@/views/${table.name}/index.vue`;

        // 查找 routeMap（统一的路由配置表）
        const routeMap = sourceFile.getVariableDeclaration('routeMap');
        if (routeMap) {
            const initializer = routeMap.getInitializer();
            if (initializer && initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const objLiteral = initializer.asKind(SyntaxKind.ObjectLiteralExpression);
                // 检查是否已存在
                const existing = objLiteral?.getProperty(`'${routePath}'`) || objLiteral?.getProperty(routePath);
                if (existing) {
                    console.log(`[skip] 路由已存在: ${routePath}`);
                } else {
                    // 添加新路由完整配置
                    objLiteral?.addPropertyAssignment({
                        name: `'${routePath}'`,
                        initializer: `{
    component: () => import('${viewPath}'),
    name: '${routeName}',
    meta: { title: '${title}', requiresAuth: true, showInHome: true },
}`,
                    });
                }
            }
        }
    }

    sourceFile.saveSync();
}
