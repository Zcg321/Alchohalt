import fg from "fast-glob";
import * as fs from "fs";
import * as path from "path";
const ROOT=process.cwd();
(async()=>{
 const files=await fg(["src/**/*.{ts,tsx}"],{cwd:ROOT,absolute:true});
 for(const abs of files){
  let code=fs.readFileSync(abs,"utf8");
  let changed=false;
  if(/import\s+i18n\s+from\s+['"][^'"]*i18n['"]/.test(code)){
   code=code.replace(/import\s+i18n\s+from\s+['"][^'"]*i18n['"];?/g,
     `import { getI18n } from "@/shared/i18n-lazy";`);
   code=code.replace(/\bi18n\./g,'(await getI18n()).');
   changed=true;
  }
  if(changed){
   if(!code.includes('@/shared/i18n-lazy')){
    code=`import { getI18n } from "@/shared/i18n-lazy";\n${code}`;
   }
   fs.writeFileSync(abs,code,"utf8");
   console.log("[lazy-i18n] updated",path.relative(ROOT,abs));
  }
 }
})();
