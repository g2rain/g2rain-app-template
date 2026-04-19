/**
 * SSO 认证服务
 * 处理单点登录相关的认证流程
 */

import { env, getPathWithContextPath, isMockEnabled } from '@shared/env';
import { useAccessTokenStore } from '@platform/stores';
import { fetchIamKeyId, fetchIamPublicKey, dpopSign } from '@/components/http';
import { getHttpClient, HttpClient, type Result } from '@/components/http';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { watch } from 'vue';
import { Generator } from '@shared/utils/random.util';
import { generateClient } from '@shared/utils/jwt.util';

class SSOService {
  private isAuthenticationPending = false;
  private pendingSubscribers: ((token: string) => void)[] = [];

  private getAccessTokenStore() {
    return useAccessTokenStore();
  }

  public async redirectToSSO(): Promise<void> {
    const accessTokenStore = this.getAccessTokenStore();
    // 如果 client 不存在，则初始化
    if (!accessTokenStore.client) {
      const client = await generateClient();
      accessTokenStore.client = client;
    }
    if (!accessTokenStore.client) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    const ssoBaseUrl = env.VITE_SSO_BASE_URL;
    const authEndpoint = env.VITE_AUTH_END_POINT;
    const redirectUriPath = env.VITE_REDIRECT_URI;

    // 构建完整的回调地址：当前应用的 base URL + context path + redirect URI
    const currentOrigin = window.location.origin;
    // 使用 getPathWithContextPath 函数处理路径拼接，避免双斜杠
    const fullRedirectPath = getPathWithContextPath(redirectUriPath);
    // 直接拼接 origin 和路径，确保路径以 / 开头
    const redirectUri = currentOrigin + (fullRedirectPath.startsWith('/') ? fullRedirectPath : '/' + fullRedirectPath);
    // 构建SSO认证URL
    const ssoUrl = new URL(ssoBaseUrl + authEndpoint);
    const params = new URLSearchParams({
      clientId: accessTokenStore.client.clientId,
      redirectUri: redirectUri,
      responseType: 'code',
      publicKey: JSON.stringify(accessTokenStore.client.publicKey),
    });

    ssoUrl.search = params.toString();
    window.location.href = ssoUrl.toString();
  }

  public async generateToken(code: string): Promise<void> {
    if (this.isAuthenticationPending) {
      return new Promise((resolve) => {
        this.pendingSubscribers.push(() => {
          resolve();
        });
      });
    }

    this.isAuthenticationPending = true;
    // 使用认证专用的 axios 实例（支持 mock）
    const generateTokenInstant = getHttpClient('auth');

    const accessTokenStore = this.getAccessTokenStore();
    const data = { code, grantType: 'authorization_code' };
    const headers: {
      DPoP: string;
      'Application-DPoP': string;
      'Content-Type': string;
    } = {
      DPoP: '',
      'Application-DPoP': '',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const jti = Generator.random();
    const request: AxiosRequestConfig = {
      headers,
      params: '',
      data,
    };
    headers.DPoP = await dpopSign(
      env.VITE_TOKEN_END_POINT,
      'post',
      '',
      data,
      env.VITE_APPLICATION_CODE,
      accessTokenStore.client,
      jti,
    );
    headers['Application-DPoP'] = await this.callSignApi(generateTokenInstant, data, headers.DPoP, jti);

    await generateTokenInstant
      .post<{ token: string; keyId: string }>(env.VITE_TOKEN_END_POINT, data, request)
      .then(async (response) => {
        // 返回的是 Result<{ token: string; keyId: string }> 格式
        const result = response as Result<{ token: string; keyId: string }>;
        if (result.status !== 200 && result.status !== 0) {
          throw new Error('GENERATE_TOKEN_FAILURE');
        }
        const { token, keyId } = result.data;
        const iamKeyId = await fetchIamKeyId(generateTokenInstant);
        const publicKey = await fetchIamPublicKey(generateTokenInstant);
        await this.getAccessTokenStore().setTokens(token, keyId, iamKeyId, publicKey);
      })
      .catch((error) => {
        this.pendingSubscribers = [];
        throw error;
      })
      .finally(() => {
        this.isAuthenticationPending = false;
      });
  }

  /**
   * 刷新 token（公共方法，返回 token 和 tokenKid）
   * 参考 generateToken 的实现，复用 authAxios 和 DPoP / Application-DPoP 签名逻辑
   */
  public async requestRefreshToken(): Promise<{ token: string; tokenKid: string }> {
    const tokenStore = this.getAccessTokenStore();

    if (!tokenStore.isLogin) {
      throw new Error('NO_LOGIN');
    }

    // 使用认证专用 axios 实例（支持 mock）
    const refreshInstant = getHttpClient('auth');

    const data = { grantType: 'refresh_token' as const };

    // 构建 DPoP 及请求头
    const headers: {
      Authorization: string;
      DPoP: string;
      'Content-Type': string;
    } = {
      Authorization: `Bearer ${tokenStore.tokenString}`,
      DPoP: '',
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const jti = Generator.random();
    const request: AxiosRequestConfig = {
      headers,
      params: '',
      data,
    };

    // 生成 DPoP 签名（直接传入 data 对象，内部统一处理）
    headers.DPoP = await dpopSign(
      env.VITE_TOKEN_END_POINT,
      'post',
      '',
      data,
      env.VITE_APPLICATION_CODE,
      tokenStore.client,
      jti,
    );

    try {
      // 返回的是 Result<{ token: string; keyId: string }> 格式
      const response = await refreshInstant.post<{ token: string; keyId: string }>(env.VITE_TOKEN_END_POINT, data, request);
      const result = response as Result<{ token: string; keyId: string }>;

      if (result.status !== 200 && result.status !== 0) {
        throw new Error('REFRESH_TOKEN_FAILURE');
      }

      const { token, keyId } = result.data;
      // 获取 IAM keyId 和公钥
      const iamKeyId = await fetchIamKeyId(refreshInstant);
      const publicKey = await fetchIamPublicKey(refreshInstant);

      // 更新 token
      await tokenStore.setTokens(token, keyId, iamKeyId, publicKey);

      // 刷新成功后重置 tokenExpired
      tokenStore.setTokenExpired(false);

      return { token, tokenKid: keyId };
    } catch (error) {
      console.error('刷新 token 失败:', error);
      throw error;
    }
  }

  public async callSignApi(http: HttpClient, data: any, headerDPoP: string, jti: string): Promise<string> {
    const response = await http.post('/lua/sign_code?jti=' + jti, data, {
      headers: {
        'Content-Type': 'application/json',
        DPoP: headerDPoP,
        // 如果启用了 mock，添加 mock header
        'x-g2rain-mock': isMockEnabled() ? 'true' : 'false',
      },
    });

    // 兼容两种返回格式：
    // 1) 直返：{ token: string }
    // 2) Result 包装：{ status, data: { token: string } }
    const raw = response as any;
    const token = raw?.token ?? raw?.data?.token;
    if (!token) {
      throw new Error('SIGN_CODE_TOKEN_MISSING');
    }
    return token;
  }

  public async listenTokenChanges(): Promise<void> {
    const tokenStore = this.getAccessTokenStore();
    const currentPath = window.location.pathname;

    if (currentPath.endsWith('/sso_callback')) {
      return;
    }
    if (!tokenStore.logged && (!tokenStore.status || tokenStore.status === 'NORMAL')) {
      await this.redirectToSSO();
    }

    watch(
      () => tokenStore.logged,
      async (newLogged) => {
        if (tokenStore.status === 'SSO' || tokenStore.status === 'LOGOUT') {
          return;
        }
        if (!newLogged && tokenStore.status === 'NORMAL') {
          await this.redirectToSSO();
        }
      },
      { immediate: true },
    );
  }
}

export const sso = new SSOService();

