/**
 * 请求挂起队列管理
 * 用于在 Token 刷新期间管理挂起的 HTTP 请求
 */

import type { InternalAxiosRequestConfig } from 'axios';
import type { HttpAuthSession } from './types';

/**
 * 请求挂起队列管理
 */
export class PendingRequestManager {
  private isRefreshPending = false;
  private pendingRequests: Array<{
    resolve: (value: InternalAxiosRequestConfig) => void;
    reject: (error: any) => void;
    config: InternalAxiosRequestConfig;
  }> = [];

  /**
   * 等待刷新完成
   */
  async waitForRefresh(authSession: HttpAuthSession): Promise<void> {
    // 如果正在刷新，等待刷新完成
    if (this.isRefreshPending) {
      return new Promise((resolve, reject) => {
        // 轮询检查刷新是否完成
        const checkInterval = setInterval(() => {
          if (!authSession.tokenExpired && authSession.isAccessTokenValid) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);

        // 10秒超时
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('TOKEN_REFRESH_TIMEOUT'));
        }, 10000);
      });
    }

    // 标记为正在刷新
    this.isRefreshPending = true;

    // 等待刷新完成
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (!authSession.tokenExpired && authSession.isAccessTokenValid) {
          clearInterval(checkInterval);
          this.isRefreshPending = false;
          // 通知所有挂起的请求
          this.notifyPendingRequests(authSession);
          resolve();
        }
      }, 50);

      // 10秒超时
      setTimeout(() => {
        clearInterval(checkInterval);
        this.isRefreshPending = false;
        this.rejectPendingRequests(new Error('TOKEN_REFRESH_TIMEOUT'));
        reject(new Error('TOKEN_REFRESH_TIMEOUT'));
      }, 10000);
    });
  }

  /**
   * 添加挂起的请求
   */
  addPendingRequest(
    config: InternalAxiosRequestConfig,
    resolve: (value: InternalAxiosRequestConfig) => void,
    reject: (error: any) => void,
  ): void {
    this.pendingRequests.push({ config, resolve, reject });
  }

  /**
   * 通知所有挂起的请求继续执行
   */
  private notifyPendingRequests(authSession: HttpAuthSession): void {
    this.pendingRequests.forEach(({ config, resolve }) => {
      // 更新请求头
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authSession.tokenString}`;
      resolve(config);
    });
    this.pendingRequests = [];
  }

  /**
   * 拒绝所有挂起的请求
   */
  private rejectPendingRequests(error: Error): void {
    this.pendingRequests.forEach(({ reject }) => {
      reject(error);
    });
    this.pendingRequests = [];
  }

  /**
   * 清除所有挂起的请求
   */
  clearPendingRequests(): void {
    this.pendingRequests = [];
    this.isRefreshPending = false;
  }

  /**
   * 检查是否正在刷新
   */
  isRefreshing(): boolean {
    return this.isRefreshPending;
  }
}

// 创建全局的请求挂起管理器单例
export const pendingRequestManager = new PendingRequestManager();
