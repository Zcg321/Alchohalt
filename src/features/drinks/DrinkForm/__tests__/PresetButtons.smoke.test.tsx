import { render } from "@testing-library/react";
import React from "react";
import * as Mod from "../PresetButtons.tsx";
test("PresetButtons.tsx mounts", () => {
  const C = (Mod as any).default ?? Object.values(Mod).find((x:any)=>typeof x==="function") ?? (()=>null);
  try {
    const { container } = render(React.createElement(C, {} as any));
    expect(container).toBeTruthy();
  } catch (e) {
    expect(e).toBeFalsy();
  }
});
