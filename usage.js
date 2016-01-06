var http = require('http');
var sessionManager = require('./session-manager.js');

// Best to use one shared session manager across requests
var sessionManager = sessionManager.create({engine: 'file', directory: __dirname + '/.session_data'});

// Usage with Node's HTTP Server
http.createServer(function (req, res) {

    if (req.url == '/') {
        // Load session for this user
        var session = sessionManager.start(req, res);
        session.set('count', (session.get('count') || 0) + 1);
    }
    
    // Display count
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end((session ? session.get('count') : '') + '\n');
    
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');