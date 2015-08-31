/*
 * grunt-bootloader
 * 
 *
 * Copyright (c) 2015 Lalit Tanwar
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

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

  function endsWith(str,suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  function setBundleConfig(bundleName, _bundleMap,includedBundles) {
    var targetName = bundleName.split("/").join("_");
    grunt.config("uglify." + targetName + ".files", _bundleMap);
    grunt.config("uglify." + targetName + ".options.footer",
        ';\n(function(foo,bundles){foo.__bundled__ = foo.__bundled__ ? foo.__bundled__.concat(bundles) : bundles;})(this,' +
       // JSON.stringify(includedBundles)
        JSON.stringify([bundleName])
        + ');'
    );
  }

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerTask('bootloader', 'Setup your webproject in an instant', function (arg1) {
    // Merge task-specific and/or target-specific options with these defaults.

    var TASK_BUNDLIFY = arg1==="bundlify";
    var TASK_SCAN = arg1==="scan";

    var options = this.options({
      version: new Date().getTime(0),
      indexBundles: ["webmodules/bootloader", "project/app"],
      src: "./",
      dest: "dest",
      resourcesJson: "resource.json"
    });

    var allFiles = {};
    var bundles = {};
    var dir = options.src;
    var dest = options.dest;
    var resourcesFile = options.resourcesJson;
    var indexBundles = options.indexBundles;
    var traversed_bundles = {}, traversed_files = {};
    var version = new Date().getTime();
    var resourcesJs = {version: options.version, bundles: bundles };

    function getFiles(packageName, files, bundledFile,includedBundles) {
      if (!traversed_bundles[packageName]) {
        traversed_bundles[packageName] = true;
        var bundle = resourcesJs.bundles[packageName];
        if (bundle) {
          bundle.bundled = bundle.bundled || [];
          bundle.in = bundle.in || [];
          for (var i in bundle.on) {
            files = getFiles(bundle.on[i], files, bundledFile,includedBundles);
          }
          for (var i in bundle.js) {
            var file = dir + "/" + bundle.js[i];
            if (!traversed_files[file]) {
              files.push(file);
              traversed_files[file] = true;
            }
          }
          if(files.length>0){
            bundle.bundled.push(bundledFile);
          }
          includedBundles.push(packageName);
        }
      }
      return files;
    }

    if (TASK_BUNDLIFY || TASK_SCAN) {
      grunt.file.recurse(dir, function (abspath, rootdir, subdir, filename) {
        if (filename === "module.json" && abspath.indexOf(dest) !== 0) {
          //console.log(abspath, rootdir, subdir, filename);
          var _bundles = grunt.file.readJSON(abspath);
          var packageName = _bundles.name;
          if (packageName !== undefined) {
            for (var bundleName in _bundles) {
              if (bundleName === packageName || bundleName.indexOf(packageName + "/") === 0) {
                if(bundles[bundleName]){
                  console.log("====Duplicate Package",bundleName);
                }
                bundles[bundleName] = { js: [], on: [], css: [] };
                for (var file_i in _bundles[bundleName].js) {
                  var js_file = subdir + "/" + _bundles[bundleName].js[file_i];
                  bundles[bundleName].js.push(js_file);
                  if(!allFiles[js_file]){
                    allFiles[js_file] = js_file;
                  } else {
                    console.log("====Duplicate File"+js_file);
                  }
                }
                for (var file_i in _bundles[bundleName].css) {
                  var css_file = subdir + "/" + _bundles[bundleName].css[file_i];
                  bundles[bundleName].css.push(css_file);
                  if(!allFiles[css_file]){
                    allFiles[css_file] = css_file;
                  } else {
                    console.log("====Duplicate File"+css_file);
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

      var myIndexBnudles = indexBundles;
      if(TASK_BUNDLIFY){
        myIndexBnudles = uniqueArray(indexBundles.concat(Object.keys(bundles).filter(function(bundleName){
          return !endsWith(bundleName,"/min") && !endsWith(bundleName,"/test");
        })));
      }

      var prevBundle = null;
      myIndexBnudles.forEach(function (bundleName) {
        var _bundleMap = {};
        var includedBundles = [];
        var bundledFile = dest + "/bootloader_bundled/" + bundleName.split("/").join(".") + ".js";
        var files = uniqueArray(getFiles(bundleName, [],bundledFile,includedBundles).reverse()).reverse();
        if(files.length>0){
          _bundleMap[bundledFile] = files;
          setBundleConfig(bundleName, _bundleMap,includedBundles);

          if(prevBundle){
            var bundle = resourcesJs.bundles[bundleName];
            if (bundle) {
              bundle.on = [prevBundle].concat(bundle.on)
            }
          }
          prevBundle = bundleName;

        } else console.log("No File in bundle to bundlify so skipping ",bundleName);
      });

      grunt.task.run("uglify");

      grunt.file.write(dest + "/" + resourcesFile, JSON.stringify(resourcesJs));
    }
  });

};
