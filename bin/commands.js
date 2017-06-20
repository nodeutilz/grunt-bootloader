#! /usr/bin/env node

var fs = require('fs');
var shell = require("shelljs");
var yargs = require("yargs");
var _ = require("underscore");


_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
};

var argv = yargs.usage("$0 command")
    .command("init", "commit changes to the repo", function (yargs) {
        var projectname = yargs.argv.name || (function(cwd){
                return cwd[cwd.length-1];
            }(process.cwd().split("/")));

        function copyFile (template,destination){
            shell.exec(["cp",__dirname+"/../template/"+template,process.cwd()+"/"+destination].join(" "))
        }
        function copyTempFile(template,destination){
            fs.readFile(__dirname+"/../template/"+template, {encoding: 'utf8'},function (err, content) {
                var compiled = _.template(content);
                fs.writeFile(process.cwd()+"/"+destination,compiled({name: projectname}), function () {
                    console.log("Created "+destination);
                })
            });
        }
        if(!fs.existsSync('src')){
            fs.mkdirSync("src");
        }
        if(!fs.existsSync('src/external')){
            fs.mkdirSync("src/external");
        }
        copyFile("temp_.bowerrc",".bowerrc");
        copyTempFile("temp_bower.json","bower.json");
        copyTempFile("temp_Gruntfile.js","Gruntfile.js");
        copyTempFile("temp_index.html","index.html");
        copyTempFile("temp_main.scss","src/main.scss");
        copyTempFile("temp_public.scss","src/external/public.scss");
        copyTempFile("temp_module.json","src/module.json");
        copyTempFile("temp_module_ext.json","src/external/module.json");
        copyTempFile("temp_app.js","src/app.js");
        copyFile("temp_app.html","src/app.html");
    })
    .demand(1, "must provide a valid command")
    .help("h")
    .alias("h", "help")
    .argv