const { build } = require("vite");
(async()=>{
  try {
    console.time("vite-build");
    await build();
    console.timeEnd("vite-build");
    console.log("Build finished.");
  } catch(e){
    console.error("Build error:",e);
    process.exit(1);
  }
})();
