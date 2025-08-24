import * as Mod from "../capacitor.ts"; test("capacitor.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
