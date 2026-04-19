/**
 * 微前端子应用初始化
 * 从主应用传递的 props 中获取 token 和 client 并设置到 store
 */

import { useAccessTokenStore } from '@platform/stores';
import { getHttpClient, fetchIamKeyId, fetchIamPublicKey } from '@/components/http';
import type { MicroAppProps } from './types';

/**
 * 初始化 token store
 * 从主应用传递的 props 中获取 token 和 client 并设置到 store
 */
export async function initTokenFromProps(props: MicroAppProps): Promise<void> {
  if (!props.token || !props.tokenKid) {
    console.warn('主应用未传递 token 或 tokenKid，跳过 token 初始化');
    return;
  }

  try {
    const tokenStore = useAccessTokenStore();
    
    // 如果主应用传递了 client，先设置 client
    if (props.client) {
      tokenStore.client = props.client;
      console.log('[micro-app] 子应用 client 已设置');
    }
    
    // 使用 auth 类型 HttpClient 获取 IAM key 信息
    const authClient = getHttpClient('auth');

    // 设置 token（需要获取 iamKeyId 和 publicKey）
    const iamKeyId = await fetchIamKeyId(authClient);
    const publicKey = await fetchIamPublicKey(authClient);
    await tokenStore.setTokens(props.token, props.tokenKid, iamKeyId, publicKey);
    console.log('[micro-app] 子应用 token 初始化成功');
  } catch (error) {
    console.error('[micro-app] 子应用 token 初始化失败:', error);
    throw error;
  }
}

