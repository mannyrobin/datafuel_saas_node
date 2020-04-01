var server = require('./web/server.js');
var dataBaseService = require('./business/dataBaseService.js');

server.initialize('vk.datafuel.ru', dataBaseService, 'https://vk.datafuel.ru');