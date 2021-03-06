/**
 * Provides volatile, memory based session storage engine.
 * 
 * This is the simplest example of a storage engine,
 * which you can base others off. 
 *
 * exports an object with two function keys, get and set. That's it.
 */
var engine = (function() {
    var that = {};
    var storage = {};

    that.set = function(session_id, key, value) {
        if (typeof storage[session_id] === "undefined") {
            storage[session_id] = { __$expireTime__ : 1 };
        }
        storage[session_id][key] = value;
        return that;
    }
    that.get = function(session_id, key) {
        return storage[session_id] && storage[session_id][key] || undefined;
    }
    that.ping = function(session_id){
      if (typeof storage[session_id] !== "undefined") {
        storage[session_id].__$expiry__ = (new Date()).getTime() + (storage[session_id].__$expireTime__ * 60000);
      }
    }
    
    return that;
});
exports.engine = engine;