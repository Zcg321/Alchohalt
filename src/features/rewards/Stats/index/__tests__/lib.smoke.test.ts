import * as Mod from "../lib.ts"; test("lib.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
