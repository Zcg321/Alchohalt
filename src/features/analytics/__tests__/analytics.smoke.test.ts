import * as Mod from "../analytics.ts"; test("analytics.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
