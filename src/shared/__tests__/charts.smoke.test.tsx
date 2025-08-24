import React, { Suspense } from "react";
import { render } from "@testing-library/react";
export function mount(mod: any){
  const C = mod?.default ?? Object.values(mod || {}).find((x:any)=>typeof x==="function") ?? (()=>null);
  try {
    const ui = <Suspense fallback={null}>{React.createElement(C, {})}</Suspense>;
    const { container } = render(ui);
    expect(container).toBeTruthy();
  } catch (e) {
    expect(e).toBeFalsy();
  }
}
import * as Mod from "../charts.tsx"; test("charts.tsx mounts", () => mount(Mod));
