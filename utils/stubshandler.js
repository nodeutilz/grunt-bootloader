var fs = require('fs');
var find = require("find");
var dummyjson = require('dummy-json');
var Promise = require('promise');
var sessionManagerModule = require(__dirname + '/../session-manager');
var Cookies = require( "cookies" );

// Best to use one shared session manager across requests
var sessionManager = sessionManagerModule.create({engine: 'memory'});
var User = require(__dirname+"/user");

if(!fs.existsSync('app')){
  fs.mkdirSync("app");
}
if(!fs.existsSync('app/data')){
  fs.mkdirSync("app/data");
}
if(!fs.existsSync('app/controller')){
  fs.mkdirSync("app/controller");
}

if(!fs.existsSync('app/helper.json')){
  fs.writeFileSync("app/helper.json", JSON.stringify({
    "name": ["Amar", "Akabar"]
  },null, "\t"));
}

var helperJSON = JSON.parse(fs.readFileSync("app/helper.json", {encoding: 'utf8'}));

var randomVal = function(type) {
	  return helperJSON[type][dummyjson.randomInt(0,helperJSON[type].length-1)];
};

var helpers = {};
Object.keys(helperJSON).map(function(key){
	helpers[key] = function(options){
		return randomVal(key);
	};
});

var MAPPERS = [];

function registerMapper(mapper,options){

  var matcher = new RegExp("^"+mapper.replace(/\{(.*?)\}/gi,'([a-z-A-Z])+').replace(/\//gi,"\/").replace(/\*/gi,"(.)*")+"$")
  var tokens =   (mapper).split(/[\/]+/gi);

  var placeholders = tokens.map(function(str,index){
    return {
      param : str.match(/(\{([^}]+)\}|\*)/g)
    }
  }).filter(function(obj,i){
    if(obj.param!=null && obj.param.length!=0){
      obj.index = i;
      obj.param = obj.param[0].substring(1, obj.param[0].length - 1)

      return true;
    }
    return false;
  });

  MAPPERS.push({
    mapper :  mapper,
    placeholders : placeholders,
    matcher : matcher, tokens : tokens,
    roles : options.roles || []
  });
  return MAPPERS[MAPPERS.length-1];
}


var router = {
  on : function(mapOrUrl,callback){
    var mapObj = {};
    if(typeof mapOrUrl === "string"){
      mapObj = registerMapper(mapOrUrl,{});
    } else {
      mapObj = registerMapper(mapOrUrl.url,mapOrUrl);
    }
    var headStr = callback.toString().split("{")[0]; //headStr will look like this: "function(jq, abc, xyz)">>string
    var headStrArg = headStr.substr(headStr.indexOf("(") + 1).split(")")[0]; //headStrArg will look like : "jq, abc, xyz">>string
    var depList;
    if (headStrArg === "") {
      depList = [];
    } else {
      depList = headStrArg.split(","); //deptList will look like: [jq, abc, xyz] >>array
    }
    for (var y = 0; y < depList.length; y++) {
      depList[y] = depList[y].trim(); //trim to remove whitespace from both ends of string
    }
    mapObj.argList = depList;
    mapObj.argParams = mapObj.argList.map(function(arg){
      return (mapObj.placeholders.filter(function(placeholder){
        return placeholder.param === arg;
      }) || [])[0];
    });
    mapObj.callback = callback;
  }
};

find.file("app/controller", function(files) {
  for(var i in files){
    var filez = files[i].split(/[\/]+/gi);
    require(process.env.PWD+"/"+files[i].replace(/\.js$/,""))(router);
  }
  router.on({
    "url" : "/___creatsession___"
  },function(){
    return this.json({});
  });
});

var Controller = require(__dirname+"/controller");

module.exports = function(req,resp,dir, next){
  var user;
  var cookies = new Cookies( req, resp);
  var session = sessionManager.start(req, resp);
  if(true){
    var dirs = req._parsedUrl.pathname.split("/");
    dirs.pop(); dirs = dirs.join("/");
    var session_id = session.getSessionId();
    cookies.set(sessionManagerModule.create.sessionIDCookieName,undefined,{ path : dirs });
    cookies.set(sessionManagerModule.create.sessionIDCookieName,session_id,{ path : "/" });
  }

  user = session.get("__USER__") || new User();
  user.__xscount__ ++;

	var method = "GET";//req.method;
  var pathname = req._parsedUrl.pathname;
  var PATHTokens = pathname.split(/[\/]+/gi);

  var tokenDiff = 10000;
  var MAPPER = null;
  for(var i in MAPPERS){
    var _tokenDiff = PATHTokens.length - MAPPERS[i].tokens.length;
    console.log("======",MAPPERS[i].matcher,user.role,pathname);
    if(MAPPERS[i].matcher.test(pathname)
      && _tokenDiff<=tokenDiff && _tokenDiff>-1
      && (MAPPERS[i].roles.length==0 || MAPPERS[i].roles.indexOf(user.role) >= 0)){
      tokenDiff = _tokenDiff;
      MAPPER = MAPPERS[i];
    }
  }

  if(MAPPER){

    var controller = new Controller(req,resp,{
      helpers : helpers
    });

    if(session){
      controller.user = user;
      session.set("__USER__", user);
    }

    var retObj = MAPPER.callback.apply(controller,
      MAPPER.argParams.map(function(param){
        return PATHTokens[param.index];
      }));
    if(retObj !== undefined && typeof retObj.done === 'function' && typeof retObj.finally === 'function'){
      retObj.then(function(retresp){
        resp.write(retresp);
      }).finally(function(resp){
        console.log("finally",resp);
        next();
      });
    } else {
      next();
    }
  } else {
    resp.write(JSON.stringify({ x : "No URL Mapping Found" }));
    var filepath = dir+req.originalUrl.split("?")[0]+".res";
    resp.write(
      dummyjson.parse(
        fs.readFileSync(filepath, {encoding: 'utf8'}),
        {helpers: helpers}
      )
    );
    next();
  }
};