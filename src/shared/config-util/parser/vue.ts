/**
 * 解析 Vue 文件，提取页面元素（v-permission 指令）
 *
 * 对每个路由页面，递归扫描 views/{routePath}/ 下所有 .vue，收集 v-permission；
 * pageCode 使用宿主页面（路由对应目录），与 pageElementCode 中「前缀」可以不一致（如抽屉内 dictionary_item:*）。
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ResourcePage, ResourcePageElement } from '@runtime/boot/types';

/**
 * 递归收集目录下所有 .vue 文件路径
 */
function collectVueFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    return [];
  }
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...collectVueFiles(full));
    } else if (e.isFile() && e.name.endsWith('.vue')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * 从模板源码中提取所有静态 v-permission 绑定值（须含冒号，形如 xxx:yyy）
 */
function extractPermissionCodes(content: string): string[] {
  const codes = new Set<string>();

  const patterns = [
    // v-permission="'foo:bar'"
    /v-permission\s*=\s*"'([^'\\]*)'"/g,
    // v-permission='"foo:bar"'
    /v-permission\s*=\s*'"([^"\\]*)"'/g,
    // v-permission="foo:bar"
    /v-permission\s*=\s*"([^"]*)"/g,
    // v-permission='foo:bar'
    /v-permission\s*=\s*'([^']*)'/g,
  ];

  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const raw = m[1].trim().replace(/^['"]|['"]$/g, '');
      if (raw.includes(':')) {
        codes.add(raw);
      }
    }
  }

  return [...codes];
}

/**
 * 从元素编码取 action 段（第一个冒号之后），用于显示名映射
 */
function permissionAction(permissionCode: string): string {
  const i = permissionCode.indexOf(':');
  return i >= 0 ? permissionCode.slice(i + 1) : permissionCode;
}

/**
 * 从 action 关键字生成中文名称（可随业务扩展）
 */
function getActionName(action: string): string {
  const actionMap: Record<string, string> = {
    add: '新增',
    edit: '编辑',
    delete: '删除',
    view: '查看',
    detail: '明细',
    export: '导出',
    import: '导入',
    save: '保存',
    cancel: '取消',
    search: '查询',
    reset: '重置',
    items: '字典项',
  };
  return actionMap[action] || action;
}

/**
 * 解析单个 Vue 文件中的 v-permission，归属宿主页面 hostPageCode
 */
function parseVueFile(filePath: string, hostPageCode: string): ResourcePageElement[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const codes = extractPermissionCodes(content);
  const elements: ResourcePageElement[] = [];

  for (const permissionCode of codes) {
    const action = permissionAction(permissionCode);
    elements.push({
      parentId: null,
      pageElementName: getActionName(action),
      pageElementCode: permissionCode,
      pageElementType: 'button',
      pageCode: hostPageCode,
      status: 'ENABLED',
    });
  }

  return elements;
}

/**
 * 解析 views 下各页面目录内全部 Vue 文件中的 v-permission
 */
export async function parseVueFiles(
  viewsDir: string,
  pages: ResourcePage[],
): Promise<ResourcePageElement[]> {
  /** 同一 pageElementCode 只保留一条（多文件重复绑定时去重） */
  const byCode = new Map<string, ResourcePageElement>();

  for (const page of pages) {
    const routePath = page.linkPath.replace(/^\//, '');
    const pageRoot = path.join(viewsDir, routePath);
    const vueFiles = collectVueFiles(pageRoot);

    if (vueFiles.length === 0) {
      if (!fs.existsSync(path.join(pageRoot, 'index.vue'))) {
        console.warn(`   ⚠️  未找到任何 Vue 文件于目录: ${pageRoot}`);
      }
      continue;
    }

    console.log(`   📂 ${page.pageCode} (${pageRoot}): ${vueFiles.length} 个 .vue`);

    for (const vueFilePath of vueFiles) {
      const rel = path.relative(viewsDir, vueFilePath);
      const elements = parseVueFile(vueFilePath, page.pageCode);
      if (elements.length > 0) {
        console.log(`      📄 ${rel} → ${elements.length} 个 v-permission`);
      }
      for (const el of elements) {
        if (!byCode.has(el.pageElementCode)) {
          byCode.set(el.pageElementCode, el);
        }
      }
    }
  }

  return [...byCode.values()].sort((a, b) =>
    a.pageElementCode.localeCompare(b.pageElementCode, 'en'),
  );
}
