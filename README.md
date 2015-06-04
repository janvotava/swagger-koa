{swagger-koa}
=========

[Swagger](http://swagger.io/specification/) is a specification and complete framework
implementation for describing, producing, consuming, and visualizing RESTful web services.
View [demo](http://petstore.swagger.io/).

__{swagger-koa}__ is a simple and clean solution to integrate swagger with koa.

## Installation

    $ npm install swagger-koa

## Quick Start

Configure {swagger-koa} as koa middleware.


`apiVersion`      -> Your api version.

`swaggerVersion`  -> Swagger version.

`swaggerUI`       -> Where is your swagger-ui?

`swaggerURL`      -> Path to use for swagger ui web interface.

`swaggerJSON`     -> Path to use for swagger ui JSON.

`basePath`        -> The basePath for swagger.js

`info`            -> [Metadata][info] about the API

`apis`            -> Define your api array.

```
var swagger = require('swagger-koa');

app.use(swagger.init({
  apiVersion: '1.0',
  swaggerVersion: '1.0',
  swaggerURL: '/swagger',
  swaggerJSON: '/api-docs.json',
  swaggerUI: './public/swagger/',
  basePath: 'http://localhost:3000',
  info: {
    title: 'swagger-koa sample app',
    description: 'Swagger + Koa = {swagger-koa}'
  },
  apis: ['./api.js', './api.yml']
}));
  ...
```

[info]: https://github.com/wordnik/swagger-spec/blob/master/versions/1.2.md#513-info-object

## Read from jsdoc

Example 'api.js'

```js

/**
 * @swagger
 * resourcePath: /api
 * description: All about API
 */

/**
 * @swagger
 * path: /login
 * operations:
 *   -  httpMethod: POST
 *      summary: Login with username and password
 *      notes: Returns a user based on username
 *      responseClass: User
 *      nickname: login
 *      consumes:
 *        - text/html
 *      parameters:
 *        - name: username
 *          description: Your username
 *          paramType: query
 *          required: true
 *          dataType: string
 *        - name: password
 *          description: Your password
 *          paramType: query
 *          required: true
 *          dataType: string
 */

exports.login = function *() {
  var user = {}
    , query = this.request.query;

  user.username = query.username;
  user.password = query.password;

  this.body = user;
};

/**
 * @swagger
 * models:
 *   User:
 *     id: User
 *     properties:
 *       username:
 *         type: String
 *       password:
 *         type: String
 */
```

## Read from yaml file

Example 'api.yml'

```yml
resourcePath: /api
description: All about API
apis:

- path: /login
  operations:

  - httpMethod: POST
    summary: Login with username and password
    notes: Returns a user based on username
    responseClass: User
    nickname: login
    consumes:
      - text/html
    parameters:

    - name: username
      dataType: string
      paramType: query
      required: true
      description: Your username

    - name: password
      dataType: string
      paramType: query
      required: true
      description: Your password

models:
    User:
      id: User
      properties:
        username:
          type: String
        password:
          type: String
```

## Read from jsdoc

Example 'api.coffee'

```coffee

###
 * @swagger
 * resourcePath: /api
 * description: All about API
###

###
 * @swagger
 * path: /login
 * operations:
 *   -  httpMethod: POST
 *      summary: Login with username and password
 *      notes: Returns a user based on username
 *      responseClass: User
 *      nickname: login
 *      consumes:
 *        - text/html
 *      parameters:
 *        - name: username
 *          description: Your username
 *          paramType: query
 *          required: true
 *          dataType: string
 *        - name: password
 *          description: Your password
 *          paramType: query
 *          required: true
 *          dataType: string
###

###
 * @swagger
 * models:
 *   User:
 *     id: User
 *     properties:
 *       username:
 *         type: String
 *       password:
 *         type: String
###
```


## Examples

Clone the {swagger-koa} repo, then install the dev dependencies:

    $ git clone git://github.com/cyner/swagger-koa.git --depth 1
    $ cd swagger-koa
    $ npm install

and run the example:

    $ cd example
    $ node --harmony app.js

# Credits

- [Express](https://github.com/visionmedia/express)
- [Koa](https://github.com/koajs/koa)
- [swagger-jack](https://github.com/feugy/swagger-jack)
- [swagger-express](https://github.com/fliptoo/swagger-express)

## License

(The MIT License)

Copyright (c) 2015 Jan Votava &lt;jan@sensible.io&gt;

Copyright (c) 2013 Fliptoo &lt;fliptoo.studio@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
