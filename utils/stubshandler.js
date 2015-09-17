var fs = require('fs');
var dummyjson = require('dummy-json');

if(!fs.existsSync('app')){
  fs.mkdirSync("app");
}
if(!fs.existsSync('app/data')){
  fs.mkdirSync("app/data");
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

module.exports = function(req,resp,dir){
	var method = "GET";//req.method;
	var filepath = dir+req.originalUrl.split("?")[0]+".res";
	resp.write(
			dummyjson.parse(
					fs.readFileSync(filepath, {encoding: 'utf8'}),
					{helpers: helpers}
			)
	);
};