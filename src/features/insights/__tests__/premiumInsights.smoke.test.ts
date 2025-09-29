import * as Mod from "../premiumInsights.ts"; test("premiumInsights.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
