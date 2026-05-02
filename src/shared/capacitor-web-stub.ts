/**
 * [R10-E] Web-build stub for `@capacitor/core`.
 *
 * The vite config externalizes `@capacitor/*` so they don't bloat the
 * web bundle. That works for plugins that are imported dynamically
 * (e.g. `@capacitor/local-notifications` via `getLocalNotifications`),
 * but `@capacitor/core` is imported statically by `src/shared/*` and
 * `src/features/health/*` — leaving its bare-specifier import in the
 * bundle, which the browser cannot resolve.
 *
 * On native builds, Capacitor's runtime resolves `@capacitor/core`
 * via the embedded WebView's import map. On web, we alias the import
 * to this stub so `Capacitor.isNativePlatform()` returns false (which
 * is the correct answer on web).
 */

export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
  isPluginAvailable: (_name: string) => false,
};

/**
 * registerPlugin shim for libraries (e.g. @revenuecat/purchases-capacitor)
 * that statically `import { registerPlugin } from '@capacitor/core'` and
 * call it at module-load time. On web we hand back a no-op proxy that
 * resolves any property access to a method that throws lazily — so
 * registration succeeds at boot, and failures only happen if/when web
 * code actually invokes a native-only method (which the
 * Capacitor.isNativePlatform() guards in shared/capacitor.ts prevent).
 */
type WebFallback = () => Promise<unknown>;
interface RegisterPluginOptions {
  web?: WebFallback;
}

export function registerPlugin<T = unknown>(
  _name: string,
  options?: RegisterPluginOptions,
): T {
  if (options?.web) {
    // The web fallback is itself an async factory — return a proxy that
    // resolves to the real instance lazily. Most callers `await` plugin
    // methods, so this works out.
    return new Proxy({} as object, {
      get(_target, prop) {
        return async (...args: unknown[]) => {
          const inst = (await options.web!()) as Record<string, unknown>;
          const fn = inst?.[prop as string];
          if (typeof fn === 'function') return (fn as (...a: unknown[]) => unknown).apply(inst, args);
          throw new Error(`Plugin method ${String(prop)} unavailable on web`);
        };
      },
    }) as T;
  }
  // No web fallback — return a proxy that throws on any method call.
  return new Proxy({} as object, {
    get(_target, prop) {
      return async () => {
        throw new Error(`Plugin method ${String(prop)} is native-only`);
      };
    },
  }) as T;
}

/**
 * WebPlugin base class shim. Some Capacitor plugins ship a Web fallback
 * that extends WebPlugin; on web builds we never invoke native methods
 * but do construct the class. Empty class works because consumers only
 * call instance methods that the plugin itself defines.
 */
export class WebPlugin {
  config: unknown;
  constructor(config?: unknown) {
    this.config = config;
  }
  protected unimplemented(_msg?: string): never {
    throw new Error('Method unimplemented on web');
  }
  protected unavailable(_msg?: string): never {
    throw new Error('Plugin unavailable on web');
  }
  addListener(_eventName: string, _listenerFunc: (...args: unknown[]) => unknown) {
    return { remove: async () => {} };
  }
  removeAllListeners(): Promise<void> { return Promise.resolve(); }
  notifyListeners(_eventName: string, _data: unknown): void {}
  hasListeners(_eventName: string): boolean { return false; }
}

export default { Capacitor, registerPlugin, WebPlugin };
