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

  function setBundleConfig(bundleName, _bundleMap) {
    var targetName = bundleName.split("/").join("_");
    grunt.config("uglify." + targetName + ".files", _bundleMap);
    grunt.config("uglify." + targetName + ".options.footer",
        ';\n(function(foo,bundles){foo.__bundled__ = foo.__bundled__ ? foo.__bundled__.concat(bundles) : bundles;})(this,["' +
        bundleName
        + '"]);'
    );
  }

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerTask('bootloader', 'Setup your webproject in an instant', function (arg1) {
    // Merge task-specific and/or target-specific options with these defaults.

    var options = this.options({
      indexBundles: ["webmodules/bootloader", "project/app"],
      src: "./",
      dest: "dest",
      resourcesJson: "resource.json"
    });

    var bundles = {};
    var dir = options.src;
    var dest = options.dest;
    var resourcesFile = options.resourcesFile;
    var indexBundles = options.indexBundles;
    var traversed_bundles = {}, traversed_files = {};
    var resourcesJs = { bundles: bundles };

    function getFiles(packageName, files, bundledFile) {
      if (!traversed_bundles[packageName]) {
        traversed_bundles[packageName] = true;
        var bundle = resourcesJs.bundles[packageName];
        if (bundle) {
          bundle.bundled = bundledFile;
          for (var i in bundle.on) {
            files = getFiles(bundle.on[i], files);
          }
          for (var i in bundle.js) {
            var file = dir + "/" + bundle.js[i];
            if (!traversed_files[file]) {
              files.push(file);
              traversed_files[file] = true;
            }
          }
        }
      }
      return files;
    }

    if (arg1 === "bundlify") {
      grunt.file.recurse(dir, function (abspath, rootdir, subdir, filename) {
        if (filename === "module.json" && abspath.indexOf(dest) !== 0) {
          //console.log(abspath, rootdir, subdir, filename);
          var _bundles = grunt.file.readJSON(abspath);
          var packageName = _bundles.name;
          if (packageName !== undefined) {
            for (var bundleName in _bundles) {
              if (bundleName === packageName || bundleName.indexOf(packageName + "/") === 0) {
                bundles[bundleName] = { js: [], on: [], css: [] };
                for (var file_i in _bundles[bundleName].js) {
                  bundles[bundleName].js.push(subdir + "/" + _bundles[bundleName].js[file_i]);
                }
                for (var file_i in _bundles[bundleName].css) {
                  bundles[bundleName].css.push(subdir + "/" + _bundles[bundleName].css[file_i]);
                }
                bundles[bundleName].on = _bundles[bundleName].on || [];
                console.log("file", abspath);
                console.log(bundleName, _bundles[bundleName].on);
              }
            }
          }
        }
      });

      indexBundles.forEach(function (bundleName) {
        var _bundleMap = {};
        var bundledFile = dest + "/" + bundleName.split("/").join(".") + ".js";
        var files = uniqueArray(getFiles(bundleName, [], bundledFile));
        _bundleMap[bundledFile] = files;
        setBundleConfig(bundleName, _bundleMap);
      });

      grunt.task.run("uglify");

      grunt.file.write(dest + "/" + resourcesFile, JSON.stringify(resourcesJs));
    }
  });

};
