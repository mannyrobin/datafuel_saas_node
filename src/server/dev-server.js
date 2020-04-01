var server = require('./web/server.js');
var dataBaseService = require('./business/dataBaseService.js');

server.initialize('localhost:8080', dataBaseService, 'https://localhost:443');