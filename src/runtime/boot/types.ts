/**
 * 应用资源类型定义
 * 用于平台资源管理：页面、页面元素、API端点
 */

import type { PageElementStatus } from '@/components/permission';

/**
 * 资源页面表（resource_page）
 * 用于定义应用中的页面资源
 */
export interface ResourcePage {
  /**
   * 页面名称
   */
  pageName: string;

  /**
   * 页面编码（唯一标识）
   */
  pageCode: string;

  /**
   * 链接路径（路由路径，如 '/user'）
   */
  linkPath: string;
}

/**
 * 页面元素表（resource_page_element）
 * 用于定义页面内的控制点（按钮、操作等）
 */
export interface ResourcePageElement {
  /**
   * 父页面元素标识（用于树形结构）
   */
  parentId: number | null;

  /**
   * 页面元素名称
   */
  pageElementName: string;

  /**
   * 页面元素编码（唯一标识，用于权限控制）
   */
  pageElementCode: string;

  /**
   * 页面元素类型（如 'button', 'menu', 'action' 等）
   */
  pageElementType: string;

  /**
   * 页面编码（关联到 resource_page.page_code）
   */
  pageCode: string | null;

  /**
   * 页面元素状态
   * visible: 显示但不可点击（disabled）
   * enabled: 显示且可点击（enabled）
   */
  status?: PageElementStatus;
}

/**
 * 接口地址表（resource_api_endpoint）
 * 用于定义API接口资源
 */
export interface ResourceApiEndpoint {
  /**
   * 接口名称
   */
  apiName: string;

  /**
   * 接口路径（如 '/user'）
   */
  apiUrl: string;

  /**
   * 请求方法（如 'GET', 'POST', 'PUT', 'DELETE'）
   */
  requestMethod: string;

  /**
   * 接口标签（接口分类）
   */
  apiTag: string;
}

/**
 * 应用资源集合
 * 包含当前应用的所有资源信息
 */
export interface ApplicationResources {
  /**
   * 页面资源列表
   */
  pages: ResourcePage[];

  /**
   * 页面元素资源列表
   */
  pageElements: ResourcePageElement[];

  /**
   * API端点资源列表
   */
  apiEndpoints: ResourceApiEndpoint[];
}

