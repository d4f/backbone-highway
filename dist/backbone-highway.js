(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('underscore'), require('backbone'), require('url-composer')) :
  typeof define === 'function' && define.amd ? define(['underscore', 'backbone', 'url-composer'], factory) :
  (global.Backbone = global.Backbone || {}, global.Backbone.Highway = factory(global._,global.Backbone,global.urlComposer));
}(this, function (_,Backbone,urlComposer) { 'use strict';

  _ = 'default' in _ ? _['default'] : _;
  Backbone = 'default' in Backbone ? Backbone['default'] : Backbone;
  urlComposer = 'default' in urlComposer ? urlComposer['default'] : urlComposer;

  function createStore () {
    var data = {}
    var keys = {}

    function get (key) {
      return keys[key]
    }

    function set (key, value) {
      keys[key] = value
    }

    function save (route) {
      // Retrieve route name
      var name = route.get('name')

      // If route is already declared throw an error
      if (_.has(data, name)) {
        throw new Error(("[ highway ] Route named " + name + " already declared"))
      }

      // Store new route
      data[name] = route
    }

    function find (search) {
      if (search.path) {
        var options = this.get('options')
        search.path = search.path.replace(options.root, '').replace(/^(\/|#)/, '')
      }

      return _.find(data, function (route) {
        return search.name === route.get('name') ||
          (route.pathRegExp && route.pathRegExp.test(search.path))
      })
    }

    function getDefinitions () {
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

    return {
      get: get,
      set: set,
      save: save,
      find: find,
      getDefinitions: getDefinitions
    }
  }

  var store = createStore()

  var BackboneRouter = {
    create: function create () {
      var Router = Backbone.Router.extend(
        store.getDefinitions()
      )
      return new Router()
    },

    start: function start (options) {
      if (!Backbone.History.started) {
        return Backbone.history.start(
          _.pick(options, ['pushState', 'hashChange', 'silent', 'root'])
        )
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

  var errorRouteNames = ['404']

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

    parse: function parse (params) {
      var path = this.get('path')

      return urlComposer.build({ path: path, params: params })
    },

    configure: function configure () {
      var ref = this.definition;
      var name = ref.name;
      var path = ref.path;

      // Check if a path was defined and that the route is not a special error route
      if (path && !_.includes(errorRouteNames, name)) {
        // Remove heading slash from path
        if (_.isString(path)) {
          path = path.replace(/^(\/|#)/, '')
        }

        // Create regex from path
        this.pathRegExp = urlComposer.regex(path)

        this.set('path', path)
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
    debug: false,

    // Event aggregator instance
    dispatcher: null
  }

  // Method to execute the 404 controller
  var error404 = function () {
    // Retrieve the 404 controller
    var error = store.find({ name: '404' })

    // Check if it was actually defined
    if (error) {
      // Execute a 404 controller
      error.execute()
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