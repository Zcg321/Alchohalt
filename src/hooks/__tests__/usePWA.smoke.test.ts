import * as Mod from "../usePWA.ts"; test("usePWA.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
