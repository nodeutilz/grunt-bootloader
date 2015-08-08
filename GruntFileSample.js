/**
 * 
 */

var datahandler = require("./app/stubs/datahandler");

/**
 * Description
 * @method exports
 * @param {} grunt
 * @return 
 */
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      my_target: {
    	  options : {
    		  footer : ""
    	  },
          files: {
          }
       }
    },
    bundlify : {
    	indexBundles : ["unidesk/init"],// ["webmodules/bootloader","unicom/external","unicom/abstracts"],
    	src : "./",
    	dest : "dist",
    	resourcesFile : "resource.json"
    },
    connect : {
    	cdnServer: {
	        options: {
	          port: 8080,
	          hostname: "*",
	          base: './',
	          keepalive: true,
	          /**
          	 * Description
          	 * @method middleware
          	 * @param {} connect
          	 * @param {} options
          	 * @return ArrayExpression
          	 */
          	middleware: function(connect, options) {
	              return [
	                connect.compress({
	                  level: 9
	                }),
	                function(req, res, next) {
	                  if (req.headers.origin === undefined) {
	                    res.setHeader('Access-Control-Allow-Origin', "*");
	                  } else {
	                    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
	                  }
	                  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	                  console.log(req.method + " on " + req.originalUrl);
	                  if (req.originalUrl.indexOf("/data/")===0) {
	                    res.setHeader('Access-Control-Allow-Headers', 'content-type');
	                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	                    res.setHeader('Content-Length', '0');
	                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
	                    datahandler(req,res,"./app/stubs/Unidesk/WebSocket");
	                    res.end();
	                  } else if(req.originalUrl.indexOf("/app/")===0) {
	                      var body = grunt.file.read(options.base+"src/index.html");
	                      res.write(body);
	                      res.end();
	                  } else {
	                    next();
	                  }
	                },
	                connect.static(options.base),
	                function(req, res, next){
	                	if(!(/\/(src|dist)\//).test(req.originalUrl)){
	                      var body = grunt.file.read("src/index.html");
	                      res.write(body);
	                      res.end();
	                	} else {
	                		 next();
	                	}
	                },
	                connect.directory(options.base)
	              ];
	            }
	        }
		}
    },
  webfont: {
      icons: {
          src: 'src/img/custom-icons/*.svg',
          dest: 'src/fonts/',
          destCss: 'src/fonts/style'
      }
  }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-webfont');

  // Default task(s).
  grunt.registerTask('default', ['uglify','webfont']);
  grunt.registerTask('start-cdn-server', ['connect:cdnServer', "watch"]);
  
  grunt.registerTask('bundlify', "Scanning all modules", function(arg) {
	    var bundles = {};
	    var dir = grunt.config("bundlify.src");
	    var dest = grunt.config("bundlify.dest");
	    var resourcesFile = grunt.config("bundlify.resourcesFile");
	    grunt.file.recurse(dir, function(abspath, rootdir, subdir, filename) {
	    	if(filename === "module.json" && abspath.indexOf(dest)!==0){
	    		//console.log(abspath, rootdir, subdir, filename);
	    		var _bundles = grunt.file.readJSON(abspath);
	    		var packageName = _bundles.name;
	    		if(packageName !== undefined){
	    			for(var bundleName in _bundles){
	    				if(bundleName === packageName || bundleName.indexOf(packageName+"/") ===0 ){
	    					bundles[bundleName] = { js : [], on :[], css : [] };
	    					for(var file_i in _bundles[bundleName].js){
	    						bundles[bundleName].js.push(subdir+"/"+_bundles[bundleName].js[file_i]);
	    					}
	    					for(var file_i in _bundles[bundleName].css){
	    						bundles[bundleName].css.push(subdir+"/"+_bundles[bundleName].css[file_i]);
	    					}
	    					bundles[bundleName].on = _bundles[bundleName].on || [];
	    					console.log("file",abspath);
	    					console.log(bundleName,_bundles[bundleName].on);
	    				}
		    		}	    			
	    		}
	    	}
	    });

	    var resourcesJs = { bundles : bundles };
	    var traversed_bundles = {}, traversed_files = {};
	    var indexBundles = grunt.config("bundlify.indexBundles");
	    var bundleMap = {};
	    
	    /**
    	 * Description
    	 * @method getFiles
    	 * @param {} packageName
    	 * @param {} files
    	 * @param {} bundledFile
    	 * @return files
    	 */
    	function getFiles(packageName,files,bundledFile){
	    	if(!traversed_bundles[packageName]){
	    		traversed_bundles[packageName] = true;
	    		var bundle = resourcesJs.bundles[packageName];
	    		if(bundle){
		    		bundle.bundled = bundledFile;
	    			for(var i in bundle.on){
	    				files = getFiles(bundle.on[i],files);
	    			}
	    			for(var i in bundle.js){
	    				var file = dir+ "/" + bundle.js[i];
	    				if(!traversed_files[file]){
	    					files.push(file);
	    					traversed_files[file] = true;
	    				}
	    			}
	    		}
	    	}
	    	return files;
	    }
	    
	    /**
    	 * Description
    	 * @method uniqueArray
    	 * @param {} list
    	 * @return a
    	 */
    	function uniqueArray(list){
		   var u = {}, a = [];
		   for(var i = 0, l = list.length; i < l; ++i){
		      if(u.hasOwnProperty(list[i])) {
		         continue;
		      }
		      a.push(list[i]);
		      u[list[i]] = 1;
		   }
		   return a;
	    }
	    
	    /**
    	 * Description
    	 * @method setBundleConfig
    	 * @param {} bundleName
    	 * @param {} _bundleMap
    	 * @return 
    	 */
    	function setBundleConfig(bundleName,_bundleMap){
	    	var targetName = bundleName.split("/").join("_");
	    	grunt.config("uglify."+targetName+".files",_bundleMap);
	    	grunt.config("uglify."+targetName+".options.footer",
	    	';\n(function(foo,bundles){foo.__bundled__ = foo.__bundled__ ? foo.__bundled__.concat(bundles) : bundles;})(this,["'+
	    		bundleName
	    	+'"]);'
	    	);
	    }

	    indexBundles.forEach(function(bundleName){
	    	var _bundleMap = {};
	    	var bundledFile =  dest + "/" +bundleName.split("/").join(".")+".js";
	    	var files = uniqueArray(getFiles(bundleName,[],bundledFile));
	    	_bundleMap[bundledFile] = files;
	    	setBundleConfig(bundleName,_bundleMap);
	    });
	    
	    grunt.task.run("uglify");
	    
	    grunt.file.write(dest+"/"+resourcesFile,JSON.stringify(resourcesJs));
  });

};