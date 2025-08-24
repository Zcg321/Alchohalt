/* eslint-disable @typescript-eslint/no-explicit-any */
/** Defer i18n heavy deps behind dynamic import */
let _i18n: any;
export async function getI18n(){
  if(_i18n) return _i18n;
  const m = await import("../i18n");
  _i18n = m;
  return _i18n;
}
