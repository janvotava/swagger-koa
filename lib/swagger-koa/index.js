var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var coffee = require('coffee-script');
var url = require('url');
var Koa = require('koa');
var mount = require('koa-mount');
var serve = require('koa-static');
var route = require('koa-route');

var doctrine = require('doctrine');
var descriptor = {};
var resources = {};

/**
 * Read from yml file
 * @api    private
 * @param  {String}   file
 * @param  {Function} fn
 */
function readYml(file, fn) {
  fs.readFile(path.resolve(process.cwd(), file), function(err, data) {

    if (err) {
      fn(err);
    }
    const resource = yaml.load(data.toString());
    let api = {};

    api.resourcePath = resource.resourcePath;
    api.description = resource.description;
    descriptor.apis.push(api);
    resources[resource.resourcePath] = resource;

    fn();
  });
}

/**
 * Parse jsDoc from a js file
 * @api    private
 * @param  {String}   file
 * @param  {Function} fn
 */
function parseJsDocs(file, fn) {
  fs.readFile(file, function(err, data) {
    if (err) {
      fn(err);
    }

    var js = data.toString();
    var regex = /\/\*\*([\s\S]*?)\*\//gm;
    var fragments = js.match(regex);
    var docs = [];

    if (!fragments) {
      fn(null, docs);
      return;
    }

    for (var i = 0; i < fragments.length; i++) {
      var fragment = fragments[i];
      var doc = doctrine.parse(fragment, {unwrap: true});

      docs.push(doc);

      if (i === fragments.length - 1) {
        fn(null, docs);
      }
    }
  });
}

/**
 * Parse coffeeDoc from a coffee file
 * @api    private
 * @param  {String}   file
 * @param  {Function} fn
 */
function parseCoffeeDocs(file, fn) {
  fs.readFile(file, function(err, data) {
    if (err) {
      fn(err);
    }

    var js = coffee.compile(data.toString());
    var regex = /\/\**([\s\S]*?)\*\//gm;
    var fragments = js.match(regex);
    var docs = [];

    for (var i = 0; i < fragments.length; i++) {
      var fragment = fragments[i];
      var doc = doctrine.parse(fragment, {unwrap: true});

      docs.push(doc);

      if (i === fragments.length - 1) {
        fn(null, docs);
      }
    }
  });
}

/**
 * Get jsDoc tag with title '@swagger'
 * @api    private
 * @param  {Object} fragment
 * @param  {Function} fn
 */
function getSwagger(fragment, fn) {
  for (var i = 0; i < fragment.tags.length; i++) {
    var tag = fragment.tags[i];
    if ('swagger' === tag.title) {
      return yaml.safeLoadAll(tag.description, fn);
    }
  }

  return fn(false);
}

/**
 *
 * @param {Object} api
 */
function pushApiIfDoesNotExist(api) {
  var found = _.findWhere(descriptor.apis, {resourcePath: api.resourcePath});

  if (found) {
    return;
  }

  descriptor.apis.push(api);
}

/**
 *
 * @param {Function} fn
 * @returns {Function}
 */
function createParserCb(fn) {
  return function(err, docs) {

    if (err) {
      fn(err);
    }

    var resource = {apis: []};

    async.eachSeries(docs, function(doc, cb) {
      getSwagger(doc, function(api) {

        if (!api) {
          return cb();
        }

        // do not rewrite existing resource
        if (api.resourcePath && resources[api.resourcePath]) {
          resource = resources[api.resourcePath];
        }

        if (api.resourcePath) {
          pushApiIfDoesNotExist(api);
          resource.resourcePath = api.resourcePath;
        } else if (api.models) {
          resource.models = Object.assign({}, resource.models || {}, api.models);
        } else {
          resource.apis.push(api);
        }

        cb();
      });
    }, function() {
      if (resource.resourcePath) {
        resources[resource.resourcePath] = resource;
      }
      fn();
    });
  };
}

/**
 * Read from jsDoc
 * @api    private
 * @param  {String}  file
 * @param  {Function} fn
 */
function readJsDoc(file, fn) {
  parseJsDocs(file, createParserCb(fn));
}

/**
 * Read from coffeeDoc
 * @api    private
 * @param  {String}  file
 * @param  {Function} fn
 */
function readCoffee(file, fn) {
  parseCoffeeDocs(file, createParserCb(fn));
}

/**
 * Read API from file
 * @api    private
 * @param  {String}   file
 * @param  {Function} fn
 */
function readApi(file, fn) {
  var ext = path.extname(file);
  if ('.js' === ext || '.ts' === ext) {
    readJsDoc(file, fn);
  } else if ('.yml' === ext) {
    readYml(file, fn);
  } else if ('.coffee' === ext) {
    readCoffee(file, fn);
  } else {
    throw new Error('Unsupported extension \'' + ext + '\'');
  }
}

/**
 * Generate Swagger documents
 * @api    private
 * @param  {Object} opt
 */
function generate(opt) {
  if (!opt) {
    throw new Error('\'option\' is required.');
  }

  if (!opt.swaggerUI) {
    throw new Error('\'swaggerUI\' is required.');
  }

  if (!opt.basePath) {
    throw new Error('\'basePath\' is required.');
  }

  descriptor.basePath = opt.basePath;
  descriptor.apiVersion = (opt.apiVersion) ? opt.apiVersion : '1.0';
  descriptor.swaggerVersion = (opt.swaggerVersion) ? opt.swaggerVersion : '1.0';
  descriptor.swaggerURL = (opt.swaggerURL) ? opt.swaggerURL : '/swagger';
  descriptor.swaggerJSON = (opt.swaggerJSON) ? opt.swaggerJSON : '/api-docs.json';
  descriptor.apis = [];

  if (opt.info) {
    descriptor.info = opt.info;
  }

  opt.apiVersion = descriptor.apiVersion;
  opt.swaggerVersion = descriptor.swaggerVersion;
  opt.swaggerURL = descriptor.swaggerURL;
  opt.swaggerJSON = descriptor.swaggerJSON;

  if (!opt.fullSwaggerJSONPath) {
    opt.fullSwaggerJSONPath = url.parse(opt.basePath + opt.swaggerJSON).path;
  }

  if (opt.apis) {
    opt.apis.forEach(function(api) {
      readApi(api, function(err) {
        if (err) {
          throw err;
        }
      });
    });
  }
}

/**
 * Koa middleware
 * @api    public
 * @param  {Object} opt
 * @return {Function}
 */
exports.init = function(opt) {
  // generate resources
  generate(opt);

  const swaggerJSON = async (ctx, nextOrResourceName) => {

    let result = _.clone(descriptor);
    let resourceName = null;

    if (typeof nextOrResourceName === 'string') {
      resourceName = nextOrResourceName;
    }

    if (resourceName) {
      if (opt.singlePagePath && resourceName === opt.singlePagePath) {
        result.apis = [];
        result.models = {};

        Object.keys(resources).forEach((name)=> {
          var resource = resources[name];
          for (var attribute in resource) {
            if (Array.isArray(resource[attribute])) {
              //arrays
              result[attribute] = result[attribute] || [];
              result[attribute] = result[attribute].concat(resource[attribute])
            } else if (typeof(resource[attribute]) == 'object') {
              // objects
              result[attribute] = result[attribute] || {};
              result[attribute] = Object.assign(result[attribute], resource[attribute])
            } else {
              // primatives (Strings / Numbers etc')
              result[attribute] = result[attribute] || resource[attribute];
            }

          }
        });
      } else {
        var resource = resources['/' + resourceName];

        if (!resource) {
          ctx.status = 404;
          return;
        }

        result.resourcePath = resource.resourcePath;
        result.apis = resource.apis;
        result.models = resource.models;
      }
    } else {
      result.apis = _.map(result.apis, function(api) {
        return {
          path: opt.swaggerJSON + api.resourcePath,
          description: api.description
        };
      });
    }

    ctx.body = result;
  };


  const app = new Koa();

  app.use(async (ctx, next) => {
    if (ctx.path === opt.swaggerURL) { // koa static barfs on root url w/o trailing slash
      ctx.redirect(ctx.path + '/');
    } else {
      await next();
    }
  });

  app.use(route.get(opt.fullSwaggerJSONPath + '/:resourceName*', swaggerJSON));
  app.use(mount(opt.swaggerURL, serve(opt.swaggerUI)));

  return mount(app, '/');
};

exports.descriptor = descriptor;
exports.resources = resources;
