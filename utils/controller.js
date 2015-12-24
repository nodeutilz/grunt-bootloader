/**
 * Created by lalittanwar on 14/12/15.
 */

var fs = require('fs');
var _ = require("underscore");
var Promise = require('promise');
var dummyjson = require('dummy-json');

var TEMPS = {};
var JSON_MAP = {};

function Controller(req,resp,META){
  this.request = req;
  this.response = resp;
  this.META = META;
}

Controller.prototype._render_view = function(path,data,resolve,reject){
  try {
    return resolve(TEMPS[path](data));
  } catch(e) {
    console.error(e);
    return reject(e);
  }
};

Controller.prototype.view = function(path,data){
  var self = this;
  return new Promise(function(resolve,reject){
    if(TEMPS[path]==undefined){
      fs.readFile("app/view/"+path, {encoding: 'utf8'},function (err, content) {
        console.log("content",content);
        if (err) throw err;
        TEMPS[path] = _.template(content);
        self._render_view(path,data,resolve,reject);
      });
    } else {
      self._render_view(path,data,resolve,reject);
    }
  });
};

Controller.prototype._render_json = function(path,data,resolve,reject){
  try {
    return resolve(dummyjson.parse(
      JSON_MAP[path],
      {helpers: this.META.helpers, data : data}
    ));
  } catch(e) {
    console.error("controller.js",e);
    return reject(e);
  }
};

Controller.prototype.json = function(path,data){
  var self = this;
  return new Promise(function(resolve,reject){
    if(typeof path === 'object'){
      try{
        resolve(JSON.stringify(path));
      } catch(e) {
        console.error("controller.js",e);
        return reject(e);
      }
    } else if(TEMPS[path] === undefined){
      fs.readFile("app/data/"+path, {encoding: 'utf8'},function (err, content) {
        console.log("content",content);
        if (err) throw err;
        JSON_MAP[path] = content;
        self._render_json(path,data,resolve,reject);
      });
    } else {
      self._render_json(path,data,resolve,reject);
    }
  });
};


module.exports = Controller;