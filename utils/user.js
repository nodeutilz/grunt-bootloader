/**
 * Created by lalittanwar on 24/12/15.
 */

var User = function User(){
  this.valid = false;
  this.__MAP__ = {};
};

User.prototype.setValid = function(isValid){
    this.valid = isValid === undefined ? true : false;
};

User.prototype.isValid = function(){
    return this.valid;
};

User.prototype.set = function(key,value){
  return this.__MAP__[key] = value;
};
User.prototype.get = function(key){
  return this.__MAP__[key];
};


module.exports = User;