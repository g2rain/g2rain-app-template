/**
 * qiankun 多 Tab 同 entry：子应用 JS 单例，不能再使用「模块级唯一 app/router」。
 * 按主壳传入的 appKey（与 Tab key 一致）隔离每个微实例的 Vue 应用与 vue-router。
 */
import type { App as VueApp } from 'vue';
import type { Router } from 'vue-router';

export const STANDALONE_SHELL_KEY = '__g2rain_standalone__';

export type MicroShellState = {
  app: VueApp | null;
  router: Router | null;
};

const shells = new Map<string, MicroShellState>();

export function getShell(instanceKey: string): MicroShellState {
  let s = shells.get(instanceKey);
  if (!s) {
    s = { app: null, router: null };
    shells.set(instanceKey, s);
  }

  return s;
}

export function removeShell(instanceKey: string): void {
  shells.delete(instanceKey);
}
