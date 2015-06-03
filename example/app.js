/**
 * Module dependencies.
 */

var koa = require('koa')
  , router = require('koa-route')
  , views = require('koa-render')
  , serve = require('koa-static')
  , api = require('./api')
  , path = require('path')
  , swagger = require('../');

var app = koa(),
    port = 3000;

app.use(views('views', { default: 'jade' }));

app.use(swagger.init({
  apiVersion: '1.0',
  swaggerVersion: '1.0',
  basePath: 'http://localhost:' + port,
  swaggerURL: '/swagger',
  swaggerJSON: '/api-docs.json',
  swaggerUI: './public/swagger/',
  apis: ['./api.js', './api.yml', 'api.coffee']
}));

app.use(serve(path.join(__dirname, 'public')));

app.use(router.get('/', function *() {
  this.body = yield this.render('index', { title: 'Koa' });
}));

app.use(router.post('/login', api.login));

app.listen(port, function() {
  console.log('Server running on port ' + port);
});
