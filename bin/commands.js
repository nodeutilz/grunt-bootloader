#! /usr/bin/env node

var fs = require('fs');
var shell = require("shelljs");
var yargs = require("yargs");
var _ = require("underscore");


_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g
};

var argv = yargs.usage("$0 command")
    .command("create", "create project from start", function (yargs) {
        var projectname = yargs.argv.name || (function(cwd){
                return cwd[cwd.length-1];
            }(process.cwd().split("/")));
        var port = (yargs.argv.port || 8080);


        function copyFile (template,destination){
            shell.exec(["cp",__dirname+"/../template/"+template,process.cwd()+"/"+destination].join(" "))
        }
        function copyTempFile(template,destination){
            fs.readFile(__dirname+"/../template/"+template, {encoding: 'utf8'},function (err, content) {
                var compiled = _.template(content);
                fs.writeFile(process.cwd()+"/"+destination,compiled({
                    name: projectname,
                    port : port
                }), function () {
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
        if(!fs.existsSync('src/style')){
            fs.mkdirSync("src/style");
        }
        if(!fs.existsSync('src/modules')){
            fs.mkdirSync("src/modules");
        }
        copyFile("temp_.bowerrc",".bowerrc");
        copyFile("temp_.jsbeautifyrc",".jsbeautifyrc");
        copyFile("temp_.jshintrc",".jshintrc");
        copyTempFile("temp_bower.json","bower.json");
        copyTempFile("temp_Gruntfile.js_","Gruntfile.js");
        copyTempFile("temp_index.html","index.html");
        copyTempFile("temp_main.scss_","src/style/main.scss");
        copyTempFile("temp_public.scss_","src/external/public.scss");
        copyTempFile("temp_module.json","src/module.json");
        copyTempFile("temp_module_ext.json","src/external/module.json");
        copyTempFile("temp_main.js","src/modules/main.js");
        copyFile("temp_main.html","src/modules/main.html");
        copyTempFile("temp_app.js","src/app.js");
        copyTempFile("temp_app.html","src/app.html");


    }).command("server", "start server", function (yargs) {
        shell.exec("grunt bootloader:server")


    }).command("scan", "scan files", function (yargs) {
        if(fs.existsSync('dist/bootloader_bundled/webmodules.bootloader.js')){
            shell.exec("grunt sass cssmin bootloader:scan:skip")
        } else {
            shell.exec("grunt sass cssmin bootloader:scan");
        }

    }).command("css", "build css files for development", function (yargs) {
        shell.exec("grunt sass cssmin");

    }).command("build", "build files for prod", function (yargs) {
        shell.exec("grunt gitinfo sass cssmin bootloader:bundlify");

    }).command("watch", "watch for changes", function (yargs) {
        shell.exec("grunt watch");

    }).command("check", "[--jsb|css] check for jshint", function (yargs) {
        var cmds = ["jshint"];
        if(yargs.argv.jsb){
            cmds.push("jsbeautifier");
        }
        if(yargs.argv.css){
            cmds.push("sass cssmin");
        }
        shell.exec("grunt "+cmds.join(" "));
    })
    .demand(1, "must provide a valid command")
    .help("h")
    .alias("h", "help")
    .argv