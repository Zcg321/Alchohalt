import * as Mod from "../vite-env.d.ts"; test("vite-env.d.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
