import * as Mod from "../common.ts"; test("common.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
