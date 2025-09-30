/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Basic globals/polyfills
if (!(global as any).crypto) {
  (global as any).crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    }
  };
}

// Add Web Crypto API mock for SHA-256 testing
if (!(global as any).crypto.subtle) {
  const nodeCrypto = require("crypto");
  (global as any).crypto.subtle = {
    digest: async (algorithm: string, data: Uint8Array) => {
      if (algorithm === 'SHA-256') {
        const hash = nodeCrypto.createHash('sha256');
        hash.update(Buffer.from(data));
        return hash.digest().buffer;
      }
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  };
}

(global as any).TextEncoder = (global as any).TextEncoder ?? require("util").TextEncoder;
(global as any).TextDecoder = (global as any).TextDecoder ?? require("util").TextDecoder;

(global as any).matchMedia = (global as any).matchMedia ?? (() => ({
  matches: false, addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false
}));

(global as any).ResizeObserver = (global as any).ResizeObserver ?? class {
  observe(){} unobserve(){} disconnect(){}
};

// Quiet known React warnings and runtime errors in tests
const origError = console.error;
console.error = (...args: any[]) => {
  const msg = String(args[0] ?? "");
  if (
    /not wrapped in act|ReactDOM.render is no longer supported|React.*invalid element|Cannot read properties of undefined|is not a function/i.test(
      msg
    )
  )
    return;
  origError(...args);
};
const origWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = String(args[0] ?? "");
  if (/Warning:/.test(msg)) return;
  origWarn(...args);
};

// Clean DOM between tests
afterEach(() => cleanup());
