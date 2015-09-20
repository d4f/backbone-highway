(function (window, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['backbone', 'underscore'], function (Backbone, _) {
      // Use globals variables in case that
      // they are undefined locally
      return factory(window, Backbone || window.Backbone, _ || window._);
    });
  }
  else if (typeof exports === 'object') {
    // Note. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(window, require('Backbone'), require('underscore'));
  }
  else {
    // Browser globals
    factory(window, window.Backbone, window._);
  }
}(this, function (window, Backbone, _) {
  'use strict';

  // Import globals
  var localStorage = window.localStorage;

  /**
   * Instance holder for the actual Backbone.Router
   * @type {Backbone.Router}
   */
  var router = null;

  /**
   * Basic Backbone routes object
   * @type {Object}
   */
  var routes = {};

  /**
   * Extended routes definitions
   * @type {Object}
   */
  var extendedRoutes = {};

  /**
   * Basic Backbone controller object
   * @type {Object}
   */
  var controller = {};

  /**
   * Extended controller
   * @type {Object}
   */
  var extendedController = {};

  /**
   * Collection of routes close event
   * @type {Object}
   */
  var closeControllers = {};

  /**
   * Trigger cache memory
   * @type {Array}
   */
  var cachedTriggers = [];

  /**
   * Default options that are extended when the router is started
   * @type {Object}
   */
  var defaultOptions = {
    // --- Backbone History options ---
    // Docs: http://backbonejs.org/#History

    // Use html5 pushState
    pushState: true,

    // Root url
    root: '',

    // Set to false to force page reloads for old browsers
    hashChange: true,

    // Don't trigger the initial route
    silent: false,

    // --------------------------------

    // Event aggregator used to dispatch triggers
    dispatcher: null,

    // The current user status, logged in or not
    authenticated: false,

    // Enable automatic execution of a login route when accessing a secured route
    redirectToLogin: false,

    // Names of automatically executed routes
    routes: {
      login: 'login',
      error404: '404',
      error403: '403'
    },

    // Print out debug information
    debug: false,

    // Override log method
    log: function () {
      if (this.debug && window.console && window.console.log) {
        window.console.log.apply(window.console, arguments);
      }
    }
  };

  /**
   * Backbone.Highway commander
   * @type {Object}
   */
  Backbone.Highway = {

    /**
     * Which event aggregator to use for the triggers listed in each routes (mandatory)
     */
    dispatcher: null,

    /**
     * Store routes that were executed last
     */
    currentRoutes: [],

    /**
     * Initialize the Backbone Marionette router
     */
    start: function (options) {
      var self = this;

      // Extend default options
      this.options = _.extend({}, defaultOptions, options);

      // Re-extend default route names instead
      // of depending on a deep extend method
      this.options.routes = _.extend({}, defaultOptions.routes, this.options.routes);

      // Store the event aggregator more conveniently
      this.dispatcher = this.options.dispatcher;

      // Ensure that the dispatcher has the expected method
      // i.e. The method "trigger" of Backbone.Events
      var methods = _.filter(['trigger'], function (method) {
        return _.isFunction(self.dispatcher[method]);
      });

      if (_.isEmpty(methods)) {
        throw '[Backbone.Highway.start] Missing a correct' +
          'dispatcher object, needs to be an instance of Backbone.Events';
      }

      this.options.log('[Backbone.Highway.start] Starting router');

      // Extend original Backbone.Router
      var Router = Backbone.Router.extend(_.extend({}, controller, {
        routes: routes
      }));

      // Initialize router
      router = new Router();

      // Check if Backbone.History is already enabled
      if (!Backbone.History.started) {
        this.options.log('[Backbone.Highway.start] Starting Backbone.history (' +
          (this.options.root ? 'root: ' + this.options.root : 'empty root url') + ')');

        // Init Backbone.history
        var existingRoute = Backbone.history.start({
          pushState: this.options.pushState,
          root: this.options.root,
          hashChange: this.options.hashChange,
          silent: this.options.silent
        });

        // Trigger a 404 if the current route doesn't exist
        // Ensure the 'silent' options isn't activated
        if (!existingRoute && !this.options.silent) {
          this.options.log('[Backbone.Highway] Inexisting load route');

          this.processControllers(self.options.routes.error404, [self.options.pushState ?
            window.location.pathname.substring(1) : window.location.hash.substring(1)
          ]);
        }
        else {
          // Check if a route was stored while requiring a user login
          var storedRoute = this.getStoredRoute();

          if (storedRoute) {
            this.options.log('[Backbone.Highway] Loaded stored route: ' + storedRoute);

            // Clear stored route
            this.clearStore();

            // Redirect to stored route
            this.go({
              path: storedRoute
            });
          }
        }
      }
    },

    /**
     * Map a list of routes.
     *
     * This method gets as the only parameter a function which will be executed in the router context,
     * therefore, any methods of the router can be called from 'this' inside that function.
     * Typically, only the 'route' method will be used.
     *
     * @param  {Function} routesDefiner A method that receives the router as context
     */
    map: function (routesDefiner) {
      if (!_.isFunction(routesDefiner)) {
        this.options.log('[Backbone.Highway.map] Missing routes definer method as the first param');
      }
      else {
        routesDefiner.call(this);
      }
    },

    /**
     * Declare a route and its actions to the Router.
     * A route is composed of a unique name and an object definition of its actions.
     * The object can be composed in a few different ways, here is an example for a route named 'user_edit' :
     *
     * {
     *   path: '/user/:id/edit',
     *   before: [
     *     // Triggers to be executed before the action
     *   ],
     *   action: function(userId) {
     *     // Custom display generation using the given userId
     *   }
     *   after: [
     *     // Triggers to be executed after the action
     *   ]
     * }
     *
     * The action can be the name of another route definition to create aliases like so :
     *
     * {
     *   path: '/',
     *   action: 'user_login'
     * }
     *
     * A route can be limited to when a user is connected by setting the route.authenticated option to true.
     * For this to work the Backbone.Highway 'authenticated' option has to be true aswell
     * when the server considers the user logged in.
     *
     * {
     *   path: '/admin',
     *   authenticated: true,
     *   action: function() {
     *     // Render admin template
     *   }
     * }
     *
     *
     * A trigger can be declared in different ways.
     * It can be a string which will be passed to the router dispatcher.
     * Else, it can be an object so that static arguments can be passed to the trigger.
     *
     * Trigger object parameters :
     *  - name (String): The trigger name
     *  - args (Array, Optional): Arguments that will be mapped onto the trigger event listener, default: []
     *  - cache (Boolean, Optional): Will only permit the execution of the trigger once
     *
     * For example :
     *
     * {
     *   name: 'core:display',
     *   args: [
     *     // List of arguments applied onto the called trigger event listener
     *   ],
     *   cache: true
     * }
     *
     * @param  {String} name The name of the route, needs to be unique (i.e. 'user.add')
     * @param  {Object} def  The route definition object
     */
    route: function (name, def) {
      var self = this,
        routesExtension = {},
        controllerExtension = {},
        currentName = name;

      // Throw an exception if def is an empty object, nothing will work
      if (!_.isObject(def)) {
        throw '[Backbone.Highway.route] Route definition needs to be an object';
      }

      // Remove the first slash in the path for the Backbone router
      if (def.path && def.path.charAt(0) === '/') {
        def.path = def.path.substring(1);
      }

      // Check if a controller has already registered this path
      if (def.path && routes[def.path]) {
        // If so, retrieve it's name
        name = routes[def.path];
      }
      else {
        // Create a placeholder for multiple route names
        extendedRoutes[def.path] = [];

        // Create a placeholder for the route controllers
        extendedController[name] = {
          re: def.path ? Backbone.Router.prototype._routeToRegExp(def.path) : null,
          wrappers: []
        };

        // Register the route path and controller name
        routesExtension[def.path] = name;

        // Create a wrapping controller method to permit for multiple route/controller bindings
        controllerExtension[name] = function () {
          self.processControllers(name, arguments);
        };

        // Apply the new routes
        _.extend(routes, routesExtension);

        // Apply the new controllers
        _.extend(controller, controllerExtension);

        if (router !== null) {
          // Add route dynamically since the router has already been started
          router.route(def.path, name, controllerExtension[name]);
        }
      }

      // Store the close controller
      if (def.close) {
        closeControllers[currentName] = def.close;
      }

      var controllerWrapper = function (args, trigger) {
        // Store the current route name if it is not a trigger
        if (!trigger) {
          self.currentRoutes.push(currentName);
        }

        // Check if the route should be ignored based on the user being logged in or not
        // and the route.authenticated option being set to true or false
        if (!_.isUndefined(def.authenticated) &&
          ((def.authenticated && !self.options.authenticated) || (!def.authenticated && self.options.authenticated))
        ) {
          // Redirect user to login route if defined, else try to execute 403 controller
          if (self.options.redirectToLogin && !self.options.authenticated) {
            self.options.log('[Backbone.Highway] Secured page, redirecting to login');

            // Store current route in case login reloads the page
            self.storeCurrentRoute();

            // Redirect to login
            self.processControllers(self.options.routes.login);
          }
          else {
            self.options.log('[Backbone.Highway] Skipping route "' + currentName +
              '", ' + (self.options.authenticated ? 'already ' : 'not ') + 'logged in');

            // Execute 403 controller
            // @todo Apply better/finer logic for when the 403 controller should be executed
            this.processControllers(self.options.routes.error403, [self.options.pushState ?
              window.location.pathname.substring(1) : window.location.hash.substring(1)
            ]);
          }
          return false;
        }

        // Check if the route is an alias
        if (_.isString(def.action)) {
          self.options.log('[Backbone.Highway] Caught alias route: "' + currentName + '" >> "' + def.action + '"');

          // Execute alias route
          self.processControllers(def.action, args, true);

          return false;
        }
        else {
          self.options.log('[Backbone.Highway] Executing route named "' + currentName + '"');
        }

        // Process pre-triggers
        if (!_.isEmpty(def.before)) {
          self.processTriggers(def.before);
        }

        // Execute route main action
        if (_.isFunction(def.action)) {
          def.action.apply(self, args);
        }

        // Process post-triggers
        if (!_.isEmpty(def.after)) {
          self.processTriggers(def.after);
        }
      };

      // Push the new controller name to the route name's list
      extendedRoutes[def.path].push(currentName);

      // Push the new controller to the given route controllers list
      extendedController[name].wrappers.push(controllerWrapper);

      // Re-push the controller with the current route name in case it overloads an existing path
      // This is to permit the go method to work on controllers defined with a same path
      if (name !== currentName) {
        // Create a placeholder for the route controllers
        // Adding the new controller to the given route controllers list
        extendedController[currentName] = {
          re: null,
          wrappers: [controllerWrapper]
        };
      }
    },

    /**
     * Route the application to a specific named route
     *
     * @param  {Mixed} name  Route name
     * @param  {Array} args  List of arguments to pass along
     * @return {Boolean}     Will return false if the routing was cancelled, else true
     */
    go: function (name, args, options) {
      var route = null,
        path = null;

      // Check if an object is given instead of a string
      if (_.isObject(name)) {
        // Rename object
        route = name;

        // Transfer route name
        name = route.name;

        // Transfer route path and remove first slash
        path = _.isString(route.path) && route.path.charAt(0) === '/' ? route.path.substring(1) : route.path;

        // Transfer args
        args = route.args || args;
      }

      if (!name && !path) {
        this.options.log('[Backbone.Highway.go] Missing parameters, name or path is necessary');
        return false;
      }

      // Check if route exists
      if ((name && !this.exists({
          name: name
        })) || (path && !this.exists({
          path: path
        }))) {
        this.options.log('[Backbone.Highway] Inexisting route name: ' + name);

        // Execute 404 controller
        this.processControllers(this.options.routes.error404, [this.options.pushState ?
          window.location.pathname.substring(1) : window.location.hash.substring(1)
        ]);
      }
      else {
        var continueProcess = true,
          self = this;

        _.forEach(this.currentRoutes, function (route) {
          // Check if the previous route has a close controller
          if (_.isFunction(closeControllers[route]) && name !== route) {
            // Execute close controller passing current route data and retrieve result
            continueProcess = closeControllers[route].call(self, name, args, options);
          }
        });

        // If controller returned false, cancel go process
        if (!continueProcess) {
          return false;
        }

        // Re-initialize currentRoutes storage
        this.currentRoutes = [];

        // Extend default router navigate options
        options = _.extend({
          trigger: true,
          replace: false
        }, options);

        if (!path) {
          // Retrieve route path passing arguments
          path = this.path(name, args);
        }

        if (path !== false) {
          // Navigate the Backbone.Router
          router.navigate(path, options);
        }

        return true;
      }
    },

    /**
     * Process a list of triggers that can be declared as a simple string or an object
     *
     * @param  {Array} triggers The list of triggers to process
     */
    processTriggers: function (triggers) {
      var self = this;

      if (_.isArray(triggers)) {
        _.forEach(triggers, function (trigger) {
          self.processTrigger(trigger);
        });
      }
      else if (_.isString(triggers) || _.isObject(triggers)) {
        this.processTrigger(triggers);
      }
      else {
        this.options.log('[Backbone.Highway.processTriggers] Bad triggers format, needs to be a string,' +
          ' an object, an array of strings or an array of objects');
      }
    },

    /**
     * Process a single trigger
     *
     * @param  {Mixed} trigger String or Object describing the trigger
     */
    processTrigger: function (trigger) {
      if (_.isObject(trigger)) {
        // Create a dispatcher format object
        var args = [trigger.name];

        // Check if the trigger is marked for caching
        if (trigger.cache) {
          // Find cached trigger object
          var cache = this.findCachedTrigger(trigger);

          // Has it already been executed ?
          if (cache.done) {
            this.options.log('[Backbone.Highway] Trigger [ ' + trigger.name + ' ] has been skipped (cached)');
            return;
          }

          // Mark it done
          cache.done = true;
        }

        // Check if the trigger is actually a declared route
        if (this.exists({
            name: trigger.name
          })) {
          this.processControllers(trigger.name, trigger.args || null, true);
          return;
        }

        // Wrap the given parameter in an array
        if (!_.isArray(trigger.args)) {
          trigger.args = [trigger.args];
        }

        // Finish formatting trigger arguments for the dispatcher
        _.forEach(trigger.args, function (arg) {
          args.push(arg);
        });

        // Dispatch the event
        this.dispatcher.trigger.apply(this.dispatcher, args);
      }
      else if (_.isString(trigger)) {
        // Check if the trigger is actually a declared route
        if (this.exists({
            name: trigger
          })) {
          this.processControllers(trigger, null, true);
        }
        else {
          // Else give to the dispatcher
          this.dispatcher.trigger.call(this.dispatcher, trigger);
        }
      }
      else {
        this.options.log('[Backbone.Highway.processTrigger] Bad trigger format, ' +
          'needs to be a string or an object, given: ' + typeof trigger);
      }
    },

    /**
     * Process a list of controllers
     *
     * @param  {String} name The name of the route
     * @param  {Array}  args JavaScript arguments array
     */
    processControllers: function (name, args, trigger) {
      var self = this;

      trigger = trigger || false;

      // Lets not pass [undefined] or [null] as arguments to the controllers
      if (_.isUndefined(args) || _.isNull(args)) {
        args = [];
      }
      // Ensure args is an array if not an arguments object
      else if (!_.isObject && !_.isArray(args)) {
        args = [args];
      }

      // Check if the given controller actually exists
      if (extendedController[name]) {
        _.forEach(extendedController[name].wrappers, function (callback) {
          callback.call(self, args, trigger);
        });
      }
      else {
        this.options.log('[Backbone.Highway.processControllers] Inexisting controller: ' + name);
      }
    },

    /**
     * Find a cached trigger
     *
     * @param  {Object} trigger Trigger object definition
     * @return {Object}         Cached trigger object
     */
    findCachedTrigger: function (trigger) {
      var cache = _.find(cachedTriggers, function (item) {
        return item.name === trigger.name;
      });

      // If it doesn't exist, create it and retrieve it again
      if (!cache) {
        cachedTriggers.push(_.extend({}, trigger));

        return this.findCachedTrigger(trigger);
      }

      return cache;
    },

    /**
     * Clear all cached triggers
     */
    clearCache: function () {
      cachedTriggers = [];
    },

    /**
     * Retrieve the path of a route by it's name.
     * Pass in optional arguments to be parsed into the path.
     *
     * @param  {String} routeName  The route name
     * @param  {Array}  args       The arguments that need to be injected into the path
     * @return {String}            The route path or false if the route doesn't exist
     */
    path: function (routeName, args) {
      var path;

      for (path in routes) {
        if (routes[path] === routeName) {
          return this.parse(path, args);
        }
      }

      return false;
    },

    /**
     * Check if a route exists by its name or its path
     *
     * @param  {Object}  params Object with a name or path key
     * @return {Boolean}        True if route exists else false
     */
    exists: function (params) {
      if (!_.isObject(params)) {
        return false;
      }

      if (params.name) {
        return !_.isUndefined(extendedController[params.name]);
      }
      else if (params.path) {
        var name = null;

        // Loop through all the controllers
        for (name in extendedController) {
          if (extendedController[name].re && extendedController[name].re.test(params.path)) {
            return true;
          }
        }
      }

      return false;
    },

    /**
     * Parse a path to inject a list of arguments into the path.
     *
     * @param  {String} path The path to parse containing argument declarations starting with colons
     * @param  {Array}  args List of arguments to inject into the path
     * @return {String}      The path with the arguments injected
     */
    parse: function (path, args) {
      if (!_.isArray(args) || _.isEmpty(args)) {
        return path;
      }

      var argIndex = 0;

      // Inject arguments
      return _.map(path.split('/'), function (part) {
          if (part.charAt(0) === ':') {
            var arg = args[argIndex];
            argIndex += 1;
            return arg;
          }
          return part;
        })
        // Join the parts with slashes
        .join('/')
        // Remove opening parentheses in case of optional parameters
        .replace('(', '')
        // Remove trailing slash
        .replace(/\/$/, '');
    },

    /**
     * Store the current pathname in the local storage
     */
    storeCurrentRoute: function () {
      // Retrieve current path
      var path = this.options.pushState ? window.location.pathname : window.location.hash;

      // Remove first / or #
      path = path.substring(1);

      this.options.log('[Backbone.Highway] Storing current path: ' + path);

      // Store the path for next init after page reload
      if (localStorage) {
        localStorage.setItem('backbone-router:path', path);
      }
    },

    /**
     * Retrieve the stored route if any
     *
     * @return {String} The currenlty stored route as a string,
     *                  null if not existing, false if localStorage doesn't exist
     */
    getStoredRoute: function () {
      return localStorage && localStorage.getItem('backbone-router:path');
    },

    /**
     * Clear the stored route
     */
    clearStore: function () {
      if (localStorage) {
        localStorage.removeItem('backbone-router:path');
      }
    },

    on: function () {
      router.on.apply(router, arguments);
    },

    off: function () {
      router.off.apply(router, arguments);
    }

  };

  return Backbone.Highway;
}));
