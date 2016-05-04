/*
 * grunt-bootloader
 * 
 *
 * Copyright (c) 2015 Lalit Tanwar
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  function cleanURL(url) {
    var protocol = null;
    url = url.replace(/[\/]+/g, '/');;
    var ars = url.split('/');
    var context = ars.shift();
    var parents = [];
    for ( var i in ars) {
      switch (ars[i]) {
        case '.':
          // Don't need to do anything here
          break;
        case '..':
          parents.pop();
          break;
        default:
          parents.push(ars[i]);
          break;
      }
    }
    if(protocol){
      return protocol +"://"+ ( context + '/' + parents.join('/')).replace(/(\/)+/g, '/');
    }
    return (context + '/' + parents.join('/')).replace(/(\/)+/g, '/');
  }

  function uniqueArray(list) {
    var u = {}, a = [];
    for (var i = 0, l = list.length; i < l; ++i) {
      if (u.hasOwnProperty(list[i])) {
        continue;
      }
      a.push(list[i]);
      u[list[i]] = 1;
    }
    return a;
  }

  function mixin(obj, proto) {
    for ( var prop in proto) {
      if (proto.hasOwnProperty(prop)) {
        obj[prop] = proto[prop];
      }
    }
    return obj;
  }

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  function setBundleConfig(bundleName, _bundleMap, includedBundles,bundledFile) {
    var targetName = bundleName.split(/[\/.]/).join("_");
    grunt.config("uglify." + targetName + ".files", _bundleMap);
    grunt.config("uglify." + targetName + ".options.footer",
        ';\n(function(foo,bundles){foo.__bundled__ = foo.__bundled__ ? foo.__bundled__.concat(bundles) : bundles;})(this,' +
        // JSON.stringify(includedBundles)
        JSON.stringify([bundleName])
        + ');/*'+_bundleMap[bundledFile].join(",")+'*/'
    );
  }

  var TASK_BUNDLIFY, TASK_SCAN, TASK_SKIP_INIT, TASK_SERVER;
  var datahandler,STUBS_URL = "./app", CONTROLLER_MATCH,INDEX_MATCH;

  function showIndex(url){
    if((/\/(src|dist|data)\//).test(url)){
      return false;
    }
    if(INDEX_MATCH && (INDEX_MATCH).test(url)){
      return true;
    }
    if((CONTROLLER_MATCH).test(url)){
      return false;
    }
    if(INDEX_MATCH){
      return false;
    }
    return true;
  }

  var bootServerOptions = {
      port: 8090,
      hostname: "*",
      base: './',
      keepalive: true,
      noBypass : /^\/(view|json|data|swagger)\//,
      indexMatch : false,
    /**
     * Description
     * @method middleware
     * @param {} connect
     * @param {} options
     * @return ArrayExpression
     */
      middleware: function (connect, options) {
      return [
        connect.compress({
          level: 9
        }),
        //require('connect-livereload')(),
        function(req, res, next){
          if (req.headers.origin === undefined) {
            res.setHeader('Access-Control-Allow-Origin', "*");
          } else {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
          }
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          console.log(req.method + " on " + req.originalUrl);
          if (req.method === "OPTIONS") {
            res.setHeader('Access-Control-Allow-Headers', 'content-type');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Content-Length', '0');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            var body = grunt.file.read(req.originalUrl.split("?")[0]);
            //res.write(body);
            res.end("200");
            //next();
          } else {
            next();
          }
        },
        connect.static(options.base),
        function (req, res, next) {
          if (showIndex(req.originalUrl)) {
            var body = grunt.file.read("index.html");
            res.write(body);
            res.end();
          } else {
            res.setHeader('Access-Control-Allow-Headers', 'content-type');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Content-Length', '0');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            datahandler(req, res, STUBS_URL, function(){
              console.log("first end");
              res.end();
              //next();
            });
          }
        },
        function (req, res, next) {
          if (req.headers.origin === undefined) {
            res.setHeader('Access-Control-Allow-Origin', "*");
          } else {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
          }
          if (showIndex(req.originalUrl)) {
            var body = grunt.file.read("index.html");
            res.write(body);
            console.log("2nd end");
            res.end();
          } else {
            next();
          }
        },
        connect.directory(options.base)
      ];
    }
  };

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  function bundler(options) {
    var allFiles = {};
    var bundles = {};
    var dir = options.src;
    var dest = options.dest;
    var resourcesFile = options.resourceJson;
    var indexBundles = options.indexBundles;
    var traversed_bundles = {}, traversed_files = {},excluded_bundles = {};
    var version = new Date().getTime();
    var resourcesJs = {};
    for (var key in options) {
      resourcesJs[key] = options[key];
    }
    resourcesJs.bundles = bundles;

    function getFiles(packageName, files, bundledFile, includedBundles) {
      if (!traversed_bundles[packageName] && !excluded_bundles[packageName]) {
        traversed_bundles[packageName] = true;
        var bundle = resourcesJs.bundles[packageName];
        if (bundle) {
          bundle.bundled = bundle.bundled || [];
          bundle.bundled_html = bundle.bundled_html || [];
          bundle.in = bundle.in || [];
          for (var i in bundle.on) {
            files = getFiles(bundle.on[i], files, bundledFile, includedBundles);
          }
          for (var i in bundle.js) {
            var file = cleanURL(dir + "/" + bundle.js[i]);
            if (!traversed_files[file]) {
              files.js.push(file);
              traversed_files[file] = true;
            }
          }
          if (files.js.length > 0) {
            bundle.bundled.push(bundledFile+".js");
          }

          for (var i in bundle.html) {
            var file = cleanURL(dir + "/" + bundle.html[i]);
            if (!traversed_files[file]) {
              files.html.push(file);
              traversed_files[file] = true;
            }
          }
          if (files.html.length > 0) {
            bundle.bundled_html.push(bundledFile+".html");
          }

          includedBundles.push(packageName);
        }
      }
      return files;
    }

    if (TASK_BUNDLIFY || TASK_SCAN) {
      grunt.file.recurse(dir, function (abspath, rootdir, subdir, filename) {
        if (filename === "module.json" && abspath.indexOf(dest) !== 0) {
          var packageInfo = {};
          if(grunt.file.exists(subdir+"/.bower.json")){
            var bowerJson =grunt.file.readJSON(subdir+"/.bower.json");
            packageInfo.bowerName = bowerJson.name;
            packageInfo.bowerVersion = bowerJson.version;
          }
          if(grunt.file.exists(subdir+"/composer.json")){
            var composerJson =grunt.file.readJSON(subdir+"/composer.json");
            packageInfo.composerName = composerJson.name;
            packageInfo.composerVersion = composerJson.version;
          }
          var _bundles = grunt.file.readJSON(abspath);
          var packageName = _bundles.name;
          if(_bundles.exclude){
            for(var i in _bundles.exclude){
              excluded_bundles[_bundles.exclude[i]] = true;
            }
          }
          if (packageName !== undefined) {
            for (var bundleName in _bundles) {
              if ((bundleName === packageName || bundleName.indexOf(packageName + "/") === 0) && !excluded_bundles[bundleName]) {
                if (bundles[bundleName]) {
                  console.log("====Duplicate Package", bundleName);
                }
                bundles[bundleName] = { js: [], on: [], css: [], html : [], packageInfo : packageInfo};
                for (var file_i in _bundles[bundleName].js) {
                  var js_file = subdir + "/" + _bundles[bundleName].js[file_i];
                  bundles[bundleName].js.push(js_file);
                  if (!allFiles[js_file]) {
                    allFiles[js_file] = js_file;
                  } else {
                    console.log("====Duplicate File" + js_file);
                  }
                }
                for (var file_i in _bundles[bundleName].css) {
                  var css_file = subdir + "/" + _bundles[bundleName].css[file_i];
                  bundles[bundleName].css.push(css_file);
                  if (!allFiles[css_file]) {
                    allFiles[css_file] = css_file;
                  } else {
                    console.log("====Duplicate File" + css_file);
                  }
                }
                for (var file_i in _bundles[bundleName].html) {
                  var html_file = subdir + "/" + _bundles[bundleName].html[file_i];
                  bundles[bundleName].html.push(html_file);
                  if (!allFiles[html_file]) {
                    allFiles[html_file] = html_file;
                  } else {
                    console.log("====Duplicate File" + html_file);
                  }
                }
                bundles[bundleName].on = _bundles[bundleName].on || [];
                console.log("==Module.json", abspath);
                //console.log(bundleName, _bundles[bundleName].on);
              }
            }
          }
        }
      });

      for(var packageKey in excluded_bundles){
        delete bundles[packageKey];
      }

      var firstIndexBundled = null;

      if (!TASK_SKIP_INIT) {
        var myIndexBnudles = indexBundles;
        if (TASK_BUNDLIFY) {
          var moreBundles = Object.keys(bundles).sort();

          if(options.projectPrefix !== undefined){
            myIndexBnudles = uniqueArray(myIndexBnudles.concat(moreBundles.filter(function(bundleName){
              return bundleName.indexOf(options.projectPrefix) === 0;
            })));
          }

          myIndexBnudles = uniqueArray(myIndexBnudles.concat(moreBundles.filter(function (bundleName) {
            return !endsWith(bundleName, "/min") && !endsWith(bundleName, "/test");
          })));

        }

        var prevBundle = null;
        myIndexBnudles.forEach(function (bundleName) {
          var _bundleMap = {};
          var includedBundles = [];
          var bundledFile = dest + "/bootloader_bundled/" + bundleName.split("/").join(".");
          var bundledFile_js = bundledFile+".js";
          var files = getFiles(bundleName, {js : [], html : []}, bundledFile, includedBundles);
          var js_files = uniqueArray(files.js.reverse()).reverse();
          if (js_files.length > 0) {
            if(!firstIndexBundled &&  options.resourcesInline){
              firstIndexBundled = bundleName;
              js_files.unshift(resourcesFile+".js");
            }
            _bundleMap[bundledFile_js] = js_files;
            //console.log("files",bundleName,files.length,files);
            setBundleConfig(bundleName, _bundleMap, includedBundles,bundledFile_js);

            if (prevBundle) {
              var bundle = resourcesJs.bundles[bundleName];
              if (bundle) {
                bundle.on = [prevBundle].concat(bundle.on)
              }
            }
            prevBundle = bundleName;

          } else console.log("No File in bundle to bundlify so skipping ", bundleName);

          var html_files = uniqueArray(files.html.reverse()).reverse();
          if(html_files.length){
            var html_file_content = "";
            for(var i in html_files){
              html_file_content+='<script type="text/html" src="'+html_files[i]+'">'+grunt.file.read(html_files[i]).split("\t").join("")
                .split("\n").join(" ")
                .split(">").map(function(v) {
                  return v.trim();
                }).join(">")+'</script>';
            }
            grunt.file.write(bundledFile+".html",html_file_content);
          }

        });

        if(firstIndexBundled){
          grunt.file.write(resourcesFile+".js", "var _BOOTLOADER_CONFIG_=" + JSON.stringify({
            RESOURCES_JSON : resourcesJs,
            RESOURCES_FILE: resourcesFile
          }));
          resourcesJs.bundles[firstIndexBundled].js.unshift(resourcesFile+".js");
        }

        grunt.task.run("uglify");
      }

      grunt.file.write(resourcesFile, JSON.stringify(resourcesJs));
    }
  }

  grunt.registerTask('bootloader', 'Setup your webproject in an instant', function (arg1, arg2) {
    // Merge task-specific and/or target-specific options with these defaults.

    TASK_BUNDLIFY = arg1 === "bundlify";
    TASK_SCAN = arg1 === "scan";
    TASK_SKIP_INIT = TASK_SCAN && arg2 == "skip";
    TASK_SERVER = arg1 === "server";

    var options = this.options({
      version: new Date().getTime(0),
      indexBundles: ["webmodules/bootloader", "project/app"],
      src: "./",
      dest: "dist",
      resourceJson: "dist/resource.json"
    });

    if (TASK_BUNDLIFY || TASK_SCAN) {
      bundler(options)
    } else if (TASK_SERVER) {
     // global.__base = options.src;
      datahandler = require(__dirname + "/../utils/stubshandler");
      var _bootServerOptions = Object.create(bootServerOptions);
      mixin(_bootServerOptions,options.bootServer);
      CONTROLLER_MATCH = _bootServerOptions.noBypass;
      INDEX_MATCH = _bootServerOptions.indexMatch;
      grunt.config("connect.bootServer.options", _bootServerOptions);
      grunt.task.run("connect:bootServer");
    } else if(arg1 === "swagger"){
      ([
        "controller/SwaggerController.js",
        "view/swaggerui.html"
      ]).forEach(function(file){
        grunt.file.copy(__dirname+"/../examples/"+file, "app/"+file);
      })
    }

  });

};
