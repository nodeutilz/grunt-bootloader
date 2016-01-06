var sessionManager = function(spec) {
        // Build object to return..
	var that = {};
        var engine = sessionManager.getEngineObject(spec.engine, spec);

        that.createSessionId = function(){
            return  (Date.now().toString() + (Math.random()*100).toString()).replace('.', '');
        };
        /**
         * Start/load the session for a given
         * request/response pair
         * @param http.ServerRequest  request
         * @param http.ServerResponse response
         */
        that.start = function(request, response,_sessionId) {
            var requestSession = {};
        
            var session_id;
            
            // Get session_id from cookies, or generate one
            var cookies = {};
            request.headers && request.headers.cookie && request.headers.cookie.split(';').forEach(function( cookie ) {
                    var parts = cookie.split('=');
                    cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
            });
            if ('string' === typeof cookies[sessionManager.sessionIDCookieName]) {
                    session_id = cookies[sessionManager.sessionIDCookieName];
            } else {
                    session_id = _sessionId || that.createSessionId();
                    
                    // Ensure our generated session id is set as a cookie
                    var writeHead = response.writeHead;
                    response.writeHead = function(statusCode) {
                        var reasonPhrase = '', headers = {};
                        if (2 == arguments.length) {
                            if ('string' == typeof arguments[1]) {
                                reasonPhrase = arguments[1];
                            } else {
                                headers = arguments[1];
                            }
                        } else if (3 == arguments.length) {
                            reasonPhrase = arguments[1];
                            headers = arguments[2];
                        }
                        headers['Set-Cookie'] = sessionManager.sessionIDCookieName + '=' + session_id;
                        writeHead.apply(response, [statusCode, reasonPhrase, headers]);
                    }
            }
  
            /**
             * Assign a key:value pair to this session
             * @param string key Key
             * @param mixed val  Associated value
             */
            requestSession.set = function(key, val) {
                    engine.set(session_id, key, val);
                    return that;
            }
            /**
             * Get a previously set session value, 
             * or undefined if not set
             * @param string key The key to lookup
             * @return mixed     The associated value, or undefined
             */
            requestSession.get = function(key) {
                    return engine.get(session_id, key);
            }
          /**
           * Get a previously set session id,
           * or undefined if not set
           * @return mixed     The session_id, or undefined
           */
          requestSession.getSessionId = function(){
              return session_id;
          };
            
            return requestSession;
        }


	return that;
	
}
/**
 * Require and return a storage engine.
 *
 * @param string name The engine name, will look for ./engines/name.js
 * @return An object with function keys set and get
 */
sessionManager.getEngineObject = function(name, fullConfig) {
    if (!fullConfig) {
        fullConfig = {};
    }
    var path = './engines/' + name + '.js';
    try {
        return require(path).engine(fullConfig);
    } catch (e) {
        throw Error("Error loading storage engine at " + path + ". " + e);
        //throw Error('Could not find storage engine at ' + path);
    }
}
// Don't want this to conflict with other app
sessionManager.sessionIDCookieName = 'brw_sess_id';

// Export constructor fn.
exports.create = sessionManager;
