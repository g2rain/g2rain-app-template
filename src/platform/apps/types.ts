/**
 * 子应用微前端类型定义
 * 仅保留与运行时 props 相关的类型，其它事件类型全部改用 `components/micro-app`
 */

import type { Client } from '@/components/http';

/**
 * 主应用传递给子应用的 props 接口
 * 支持所有微前端模式（Qiankun、single-spa、Module Federation 等）
 */
export interface MicroAppProps {
  container?: HTMLElement;
  token?: string; // token 字符串
  tokenKid?: string; // token 的 kid (key id)
  client?: Client; // client 信息（包含 clientId, publicKey, privateKey）
  paths?: string[]; // 允许访问的路径列表（用于动态加载路由）
  initialRoute?: string; // 初始路由路径（如 '/test/dict'），用于子应用初始化时跳转
  appKey?: string; // 子应用的标识（menuItem的key，唯一）
  activeRule?: string; // 子应用的激活规则（如 '/sub-app-1'）
  entryOrigin?: string; // 子应用的 entry origin（用于后端请求，如 'http://localhost:3001'）
  [key: string]: any; // 允许其他自定义参数
}

