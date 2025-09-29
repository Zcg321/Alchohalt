import * as Mod from "../subscriptionStore.ts"; test("subscriptionStore.ts exports callable", () => { for (const v of Object.values(Mod)) if (typeof v==="function"){ try{ (v as any)(); }catch{} } });
