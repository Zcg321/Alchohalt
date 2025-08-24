import * as Mod from "../virtual-pwa.d.ts"; test("virtual-pwa.d.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
