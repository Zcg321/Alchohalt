// @no-smoke
import { registerSW as pwaRegister } from 'virtual:pwa-register';

export function registerSW() {
  pwaRegister({ immediate: true });
}
