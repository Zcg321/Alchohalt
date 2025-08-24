import fg from "fast-glob";
import * as fs from "fs";
import * as path from "path";
const ROOT=process.cwd();
(async()=>{
 const files=await fg(["src/**/*.{ts,tsx}"],{cwd:ROOT,absolute:true});
 for(const abs of files){
  let code=fs.readFileSync(abs,"utf8");
  let changed=false;
  if(/from\s+['"]lodash['"]/.test(code)){
   code=code.replace(/import\s+{([^}]+)}\s+from\s+['"]lodash['"];?/g,(m,inner)=>{
    return inner.split(',').map(s=>s.trim()).filter(Boolean).map(name=>`import ${name} from "lodash-es/${name}.js";`).join("\n");
   });
   changed=true;
  }
  if(/from\s+['"]moment['"]/.test(code)){
   code=code.replace(/from\s+['"]moment['"]/g,'from "dayjs"');
   changed=true;
  }
  if(changed){
   fs.writeFileSync(abs,code,"utf8");
   console.log("[shake-libs] updated",path.relative(ROOT,abs));
  }
 }
})();
