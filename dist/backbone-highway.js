(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('underscore'), require('backbone')) :
  typeof define === 'function' && define.amd ? define(['underscore', 'backbone'], factory) :
  (global.Backbone = global.Backbone || {}, global.Backbone.Highway = factory(global._,global.Backbone));
}(this, function (_,Backbone) { 'use strict';

  _ = 'default' in _ ? _['default'] : _;
  Backbone = 'default' in Backbone ? Backbone['default'] : Backbone;

  // Path parsing regular expressions
  var re = {
    headingSlash: /^(\/|#)/,
    trailingSlash: /\/$/,
    parentheses: /[\(\)]/g,
    optionalParams: /\((.*?)\)/g,
    splatParams: /\*\w+/g,
    namedParam: /(\(\?)?:\w+/,
    namedParams: /(\(\?)?:\w+/g
  }

  var utils = {
    re: re,

    stripHeadingSlash: function stripHeadingSlash (path) {
      return _.isString(path) && path.replace(re.headingSlash, '')
    },

    routeToRegExp: function routeToRegExp (path) {
      return Backbone.Router.prototype._routeToRegExp(path)
    },

    isValidArgsArray: function isValidArgsArray (args) {
      return !_.isEmpty(utils.sanitizeArgs(args))
    },

    sanitizeArgs: function sanitizeArgs (args) {
      if (!_.isObject(args) && !_.isArray(args)) {
        args = [args]
      }
      return _.without(args, null, undefined)
    },

    removeOptionalParams: function removeOptionalParams (path) {
      return path.replace(re.optionalParams, '')
    },

    replaceArgs: function replaceArgs (path, args) {
      _.forEach(utils.sanitizeArgs(args), function (arg) {
        path = utils.replaceArg(path, arg)
      })

      _.forEach(path.match(re.optionalParams), function (part) {
        if (utils.isNamedOrSplatParam(part)) {
          path = path.replace(part, '')
        }
      })

      return path
    },

    replaceArg: function replaceArg (path, arg) {
      return path.indexOf(':') !== -1 ? path.replace(re.namedParam, arg) : path.replace(re.splatParams, arg)
    },

    isNamedOrSplatParam: function isNamedOrSplatParam (param) {
      return re.namedParam.test(param) || re.splatParams.test(param)
    },

    removeTrailingSlash: function removeTrailingSlash (path) {
      return path.replace(re.trailingSlash, '')
    },

    removeHeadingSlash: function removeHeadingSlash (path) {
      return _.isString(path) && path.replace(re.headingSlash, '')
    },

    removeParentheses: function removeParentheses (path) {
      return path.replace(re.parentheses, '')
    },

    removeRootUrl: function removeRootUrl (path, rootUrl) {
      return _.isString(path) && path.replace(rootUrl, '')
    }
  }

  var data = {}
  var keys = {}

  var store = {
    get: function get (key) {
      return keys[key]
    },

    set: function set (key, value) {
      keys[key] = value
    },

    save: function save (route) {
      // Retrieve route name
      var name = route.get('name')

      // If route is already declared throw an error
      if (_.has(data, name)) {
        throw new Error(("[ highway ] Route named " + name + " already declared"))
      }

      // Store new route
      data[name] = route
    },

    find: function find (search) {
      if (search.path) {
        var options = this.get('options')
        search.path = utils.removeHeadingSlash(
          utils.removeRootUrl(search.path, options.root)
        )
      }

      return this.findByName(search.name) || this.findByPath(search.path)
    },

    findByName: function findByName (name) {
      return name && _.find(data, function (route) { return name === route.get('name'); })
    },

    findByPath: function findByPath (path) {
      return path && _.find(data, function (route) { return route.pathRegExp.test(path); })
    },

    getDefinitions: function getDefinitions () {
      var routes = {}
      var controllers = {}

      _.forEach(data, function (route, name) {
        routes[route.get('path')] = name
      })

      _.forEach(data, function (route, name) {
        controllers[name] = route.get('action')
      })

      return _.extend({ routes: routes }, controllers)
    }
  }

  var historyOptions = [
    'pushState',
    'hashChange',
    'silent',
    'root'
  ]

  var BackboneRouter = {
    create: function create () {
      var Router = Backbone.Router.extend(
        store.getDefinitions()
      )
      return new Router()
    },

    start: function start (options) {
      if (!Backbone.History.started) {
        return Backbone.history.start(_.pick(options, historyOptions))
      }

      return null
    },

    restart: function restart () {
      Backbone.history.stop()
      Backbone.history.start()
    }
  }

  var trigger = {
    send: function send (routeName, events, args) {
      if (!_.isArray(events)) {
        throw new Error(("[ highway ] Route events definition for " + routeName + " needs to be an Array"))
      }

      var ref = store.get('options');
      var dispatcher = ref.dispatcher;

      if (!dispatcher) {
        throw new Error('[ highway ] No dispatcher has been declared to trigger events')
      }

      events.forEach(function (event) {
        if (_.isString(event)) {
          event = { name: event }
        }

        args = event.args || event.params || args

        console.log(("Trigger event " + (event.name) + ", args:"), args)

        dispatcher.trigger.apply(dispatcher, [ event.name ].concat( args ))
      })
    }
  }

  var errorRouteNames = ['403', '404']

  var defaultDefinition = {
    name: null,
    path: null,
    action: null
  }

  var defaultNavigateOptions = {
    trigger: true,
    replace: false
  }

  function Route (definition) {
    // Store route definition
    this.definition = _.extend({}, defaultDefinition, definition)

    this.configure()
  }

  Route.prototype = {
    get: function get (property) {
      return this.definition[property]
    },

    set: function set (property, value) {
      this.definition[property] = value
    },

    parse: function parse (args) {
      var path = this.get('path')

      if (!utils.isValidArgsArray(args)) {
        return utils.removeOptionalParams(path)
      }

      path = utils.replaceArgs(path, args)

      path = utils.removeTrailingSlash(
        utils.removeParentheses(path)
      )

      return path
    },

    configure: function configure () {
      var ref = this.definition;
      var name = ref.name;
      var path = ref.path;

      // Check if a path was defined and that the route is not a special error route
      if (path && !_.contains(errorRouteNames, name)) {
        // Remove heading slash from path
        this.set('path', utils.stripHeadingSlash(this.get('path')))

        // Create regex from path
        this.pathRegExp = utils.routeToRegExp(this.get('path'))
      }

      // Override the given action with the wrapped action
      this.set('action', this.getActionWrapper())
    },

    execute: function execute () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      this.get('action').apply(void 0, args)
    },

    getActionWrapper: function getActionWrapper () {
      var ref = this.definition;
      var name = ref.name;
      var action = ref.action;
      var events = ref.events;

      // Wrap the route action
      return function actionWrapper () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        if (events) trigger.send(name, events, args)
        action.apply(void 0, args)
      }
    },

    getNavigateOptions: function getNavigateOptions (options) {
      return _.extend({}, defaultNavigateOptions, _.pick(options, ['trigger', 'replace']))
    }
  }

  var defaultOptions = {
    // #### Backbone History options
    // Docs: http://backbonejs.org/#History

    // Use html5 pushState
    pushState: true,

    // Root url for pushState
    root: '',

    // Set to false to force page reloads for old browsers
    hashChange: true,

    // Don't trigger the initial route
    silent: false,

    // #### Backbone.Highway specific options

    // Print out debug information
    debug: true,

    // Event aggregator instance
    dispatcher: null
  }

  // Method to execute the 404 controller
  var error404 = function () {
    // Retrieve the 404 controller
    var error = store.findByName('404')

    // Check if it was actually defined
    if (error) {
      // Execute a 404 controller
      error.execute()
    } else {
      // If no 404 controller is defined throw an error
      throw new Error('[ highway ] 404! Landing route is not registered')
    }
  }

  var lastRoute = null

  // #### Highway public API definition
  var highway = {
    // **Initialize the Backbone.Highway router**
    // - *@param {Object} **options** - Object to override default router configuration*
    start: function start (options) {
      // Extend default options
      options = _.extend({}, defaultOptions, options)

      // Store options in global store
      store.set('options', options)

      // Instantiate Backbone.Router
      this.router = BackboneRouter.create()

      // Start Backbone.history
      var existingRoute = BackboneRouter.start(options)

      // Check if the first load route exists, if not and
      // the router is not started silently try to execute 404 controller
      if (!existingRoute && !options.silent) error404()
    },

    // **Register a route to the Backbone.Highway router**
    // - *@param {Object} **definition** - The route definition*
    route: function route (definition) {
      // Create a new route using the given definition
      var route = new Route(definition)

      // Store the route in the global store
      store.save(route)

      // Check if Backbone.Router is already started
      if (this.router && route.get('path')) {
        // Dynamically declare route to Backbone.Router
        this.router.route(
          route.get('path'),
          route.get('name'),
          route.get('action')
        )
      }
    },

    // **Navigate to a declared route using its name or path**
    // - *@param {Mixed} **to** - Route name or Object describing where to navigate*
    go: function go (to) {
      if (!_.isString(to) && !_.isObject(to)) {
        throw new Error(("[ highway.go ] Navigate option needs to be a string or an object, got \"" + to + "\""))
      } else if (_.isObject(to) && !to.name && !to.path) {
        throw new Error('[ highway.go ] Navigate object is missing a "name" or "path" key')
      }

      // Transform route name to navigate object definition
      if (_.isString(to)) {
        to = { name: to }
      }

      // Find the route instance
      var route = store.find(to)

      // Check if the route exists
      if (!route) {
        error404()
        return false
      }

      // Parse the route path passing in arguments
      if (!to.path) {
        to.path = route.parse(to.args || to.params)
      }

      // Execute Backbone.Router navigate
      this.router.navigate(to.path, route.getNavigateOptions(to))

      // Force re-executing of the same route
      if (to.force && lastRoute && route.get('name') === lastRoute.get('name')) {
        this.reload()
      }

      // Store the last executed route
      lastRoute = route

      return true
    },

    // Reload current route by restarting `Backbone.history`.
    reload: BackboneRouter.restart,

    // Alias for `reload` method.
    restart: BackboneRouter.restart
  }

  return highway;

}));