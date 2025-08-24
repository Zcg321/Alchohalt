/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

export const LazyRecharts: any = new Proxy({}, {
  get(_target, prop: string) {
    return React.lazy(async () => {
      const mod: any = await import("recharts");
      return { default: mod[prop] };
    });
  }
});
