var modConcat = require("node-module-concat");
var outputFile = "./concatenated.js";
modConcat("./src/server/prod-server.js", outputFile, function(err, files) {
    if(err) throw err;
    console.log(files.length + " were combined into " + outputFile);
});