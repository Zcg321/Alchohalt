const fs=require("fs"),path=require("path");
const MIN=parseInt(process.env.TEST_COVERAGE_LINES??"50",10);
function find(name,dir="coverage"){
 if(!fs.existsSync(dir)) return null;
 const st=fs.statSync(dir);
 if(st.isFile()) return path.basename(dir)===name ? dir : null;
 for(const e of fs.readdirSync(dir)){
  const p=path.join(dir,e);
  const f=find(name,p);
  if(f) return f;
 }
 return null;
}
let summaryPath=find("coverage-summary.json");
if(!summaryPath){
 try { require("./coverage_fallback"); } catch {}
 summaryPath=find("coverage-summary.json");
}
if(!summaryPath){
 console.error("coverage-summary.json not found");
 process.exit(1);
}
const summary=JSON.parse(fs.readFileSync(summaryPath,"utf8"));
const pct=summary.total?.lines?.pct ?? 0;
if(pct<MIN){
 console.error(`Coverage gate failed: ${pct}% < ${MIN}%`);
 process.exit(1);
}
console.log(`Coverage OK: ${pct}% >= ${MIN}%`);
