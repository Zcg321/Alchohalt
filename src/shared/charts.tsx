import React from "react";

export const LazyRecharts: any = new Proxy({}, {
  get(_target, prop: string) {
    return React.lazy(() => import("recharts").then((mod: any) => ({ default: mod[prop] })));
  }
});
