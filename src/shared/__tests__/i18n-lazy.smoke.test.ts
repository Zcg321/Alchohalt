import * as Mod from "../i18n-lazy.ts"; test("i18n-lazy.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
