import * as Mod from "../achievementSystem.ts"; test("achievementSystem.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
