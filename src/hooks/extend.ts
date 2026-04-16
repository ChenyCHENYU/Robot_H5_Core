/**
 * Hook 扩展机制
 * 支持项目侧注册 before/after 钩子，不修改包源码
 */

export interface HookExtension {
  /** 在 Hook 核心逻辑执行前调用 */
  before?: (...args: any[]) => any[] | Promise<any[]>;
  /** 在 Hook 核心逻辑执行后调用 */
  after?: (result: any, context: ExtensionContext) => any | Promise<any>;
}

export interface ExtensionContext {
  /** 当前 Hook 名称 */
  hookName: string;
  /** 自定义元数据（项目可附加任意信息） */
  meta: Record<string, any>;
}

const extensionRegistry = new Map<string, HookExtension[]>();

/**
 * 注册 Hook 扩展（项目侧使用）
 *
 * @example
 * ```ts
 * extendHook('useCamera', {
 *   after: async (file, ctx) => {
 *     ctx.meta.ossUrl = await uploadToOss(file);
 *     return file;
 *   },
 * });
 * ```
 */
export function extendHook(hookName: string, extension: HookExtension): void {
  const list = extensionRegistry.get(hookName) ?? [];
  list.push(extension);
  extensionRegistry.set(hookName, list);
}

/**
 * 内部：执行 before 扩展链
 */
export async function runBeforeExtensions(
  hookName: string,
  args: any[],
): Promise<any[]> {
  const list = extensionRegistry.get(hookName) ?? [];
  let current = args;
  for (const ext of list) {
    if (ext.before) {
      current = (await ext.before(...current)) ?? current;
    }
  }
  return current;
}

/**
 * 内部：执行 after 扩展链
 */
export async function runAfterExtensions(
  hookName: string,
  result: any,
): Promise<any> {
  const list = extensionRegistry.get(hookName) ?? [];
  let current = result;
  const context: ExtensionContext = { hookName, meta: {} };
  for (const ext of list) {
    if (ext.after) {
      current = (await ext.after(current, context)) ?? current;
    }
  }
  return current;
}

/**
 * 清除所有扩展（测试用）
 */
export function clearExtensions(): void {
  extensionRegistry.clear();
}
