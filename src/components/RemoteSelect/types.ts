/**
 * 远程搜索选择组件类型定义
 */

/**
 * 远程数据获取函数接口
 * @param params 查询参数对象，包含 key（名称）和 value（ID）
 * @returns Promise<选项数组>
 */
export type FetchDataFunction<T extends Record<string, any> = Record<string, any>> = (
  params: { key?: string; value?: number }
) => Promise<T[]>;

export interface RemoteSelectOption {
  [key: string]: any;
}
