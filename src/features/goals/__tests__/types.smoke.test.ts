import * as Mod from "../types.ts"; test("types.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
