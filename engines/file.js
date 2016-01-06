/**
 * Provides persistent, file based session storage engine.
 *
 * Simply writes the JSON into a file structure like
 * .session_data/{session_id}/{hash of key}.json containing
 * JSON serialisation
 *
 * exports an object with two function keys, get and set. That's it.
 */
 
var fs = require('fs');
var engine = (function(config) {

    var that = {};
    
    var storageDir = config['directory'];
    
    var hashKey = function(key) {
        var hash = key.replace(/./g, function(c) {
            return c.charCodeAt(0);
        });
        return hash;
    }
    
    that.set = function(session_id, key, value) {
        
        try {
            fs.mkdir(storageDir + '/' + session_id, 0777, function(err, data) {
                fs.writeFileSync(storageDir + '/' + session_id + '/' + hashKey(key), JSON.stringify(value));
            });
        } catch (e) {
            throw Error("Couldn't write data to disk" + e);
        }
        
        return that;
    }
    that.get = function(session_id, key) {
        try {
            var data = fs.readFileSync(storageDir + '/' + session_id + '/' + hashKey(key), 'utf8');
            console.log(data);
            return JSON.parse(data);
        } catch (e) {
            console.log(e);
            return undefined;
        }
    }
    
    return that;
});
exports.engine = engine;
