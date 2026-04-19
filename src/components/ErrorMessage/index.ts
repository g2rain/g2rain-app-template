import { ElMessage } from 'element-plus';
import type { AppError } from '@/components/error';

export interface ErrorMessageOptions {
  title?: string;
  duration?: number;
}

export type ErrorMessagePayload = string | Error | AppError;

/**
 * 统一的错误消息展示组件封装
 *
 * - 默认使用 Element Plus 的 ElMessage
 * - 后续如果需要自定义样式或改为自定义弹窗，只需修改此处实现
 * - 结合 AppError：如果传入的是 AppError，则优先展示 errorCode + message
 */
export function showErrorMessage(error: ErrorMessagePayload, options: ErrorMessageOptions = {}): void {
  let message = '请求失败';
  let errorCode: string | undefined;

  if (typeof error === 'string') {
    message = error;
  } else {
    message = error.message || message;
    const appError = error as AppError;
    if (appError.errorCode) {
      errorCode = appError.errorCode;
    }
  }

  const fullMessage = errorCode ? `[${errorCode}] ${message}` : message;

  ElMessage({
    type: 'error',
    message: fullMessage,
    duration: options.duration ?? 3000,
  });
}

