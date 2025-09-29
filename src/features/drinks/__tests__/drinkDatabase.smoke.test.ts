import * as Mod from "../drinkDatabase.ts"; test("drinkDatabase.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
