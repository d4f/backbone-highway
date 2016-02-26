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
    module.exports = factory(window, require('backbone'), require('underscore'));
  }
  else {
    // Browser globals
    factory(window, window.Backbone, window._);
  }
}(this, function (window, Backbone, _) {
  'use strict';

  // Import globals
  var localStorage = window.localStorage;

  // Instance holder for the actual Backbone.Router
  var router = null;

  // Basic Backbone routes object
  var routes = {};

  // Extended routes definitions
  var extendedRoutes = {};

  // Basic Backbone controller object
  var controller = {};

  // Extended controller
  var extendedController = {};

  // Collection of routes close event
  var closeControllers = {};

  // Trigger cache memory
  var cachedTriggers = [];

  // Path parsing regular expressions
  var re = {
    headingSlash: /^(\/|#)/,
    trailingSlash: /\/$/,
    parentheses: /[\(\)]/g,
    optionalParams: /\((.*?)\)/g,
    splatParams: /\*\w+/g,
    namedParam: /(\(\?)?:\w+/,
    namedParams: /(\(\?)?:\w+/g
  };

  // --------------------------------

  // **Default options that are extended when the router is started**
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

    // Local storage
    store: {
      prefix: 'backbone-highway',
      separator: ':'
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

  // --------------------------------

  // **Map a list of routes.**
  // - *@param {Function} **method** - A method that receives the router as context*
  //
  // This method gets as the only parameter a function which will be executed in the router context,
  // therefore, any methods of the router can be called from 'this' inside that function.
  // Typically, only the 'route' method will be used.
  var definer = function (method) {
    if (!_.isFunction(method)) {
      this.options.log('[Backbone.Highway.map] Missing routes definer method as the first parameter');
      throw new TypeError(
        '[Backbone.Highway.map] First and only argument should be a function, instead got ' +
        (typeof method)
      );
    }

    return method.call(this);
  };

  // **Backbone.Highway commander**
  var Highway = function Highway () {};

  // Highway prototype
  Highway.prototype = {

    // Store routes that were executed last
    currentRoutes: [],

    // --------------------------------

    // **Initialize the Backbone.Highway router**
    // - *@param {Object} **options** - Object to override default router configuration*
    start: function (options) {
      // Extend default options
      this.options = _.extend({}, defaultOptions, options);

      // Re-extend default route names instead
      // of depending on a deep extend method
      this.options.routes = _.extend({}, defaultOptions.routes, this.options.routes);

      // Store the event aggregator more conveniently
      this.dispatcher = this.options.dispatcher;

      this.options.log('[Backbone.Highway.start] Starting router');

      // Extend original Backbone.Router
      var Router = Backbone.Router.extend(_.extend({}, controller, {
        routes: routes
      }));

      // Initialize Backbone.Router instance
      router = new Router();

      // Start Backbone.History
      this._startHistory();
    },

    // --------------------------------

    // Apply the definer method to Highway prototype
    map: definer,
    define: definer,
    declare: definer,

    // --------------------------------

    // **Declare a route and its actions to the Router.**
    // - *@param  {String} **name** The name of the route, needs to be unique (e.g. 'user.add')*
    // - *@param  {Object} **def**  The route definition object*
    //
    // A route is composed of a unique name and an object definition of its actions.
    // The object can be composed in a few different ways, here is an example for a route named 'user_edit' :
    //
    // ```javascript
    // {
    //   path: '/user/:id/edit',
    //   before: [
    //     // Triggers to be executed before the action
    //   ],
    //   action: function(userId) {
    //     // Custom display generation using the given userId
    //   }
    //   after: [
    //     // Triggers to be executed after the action
    //   ]
    // }
    // ```
    //
    // The action can be the name of another route definition to create aliases like so :
    //
    // ```javascript
    // {
    //   path: '/',
    //   action: 'user_login'
    // }
    // ```
    //
    // A route can be limited to when a user is connected by setting the route.authenticated option to true.
    // For this to work the Backbone.Highway 'authenticated' option has to be true aswell
    // when the server considers the user logged in.
    //
    // ```javascript
    // {
    //   path: '/admin',
    //   authenticated: true,
    //   action: function() {
    //     // Render admin template
    //   }
    // }
    // ```
    //
    // A trigger can be declared in different ways.
    // It can be a string which will be passed to the router dispatcher.
    // Else, it can be an object so that static arguments can be passed to the trigger.
    //
    // Trigger object parameters :
    // - name (String): The trigger name
    // - path (String): Trigger name can be replaced by a route path
    // - args (Array, Optional): Arguments that will be mapped onto the trigger event listener, default: []
    // - cache (Boolean, Optional): Will only permit the execution of the trigger once
    //
    // For example :
    //
    // ```javascript
    // {
    //   name: 'core:display',
    //   args: [
    //     // List of arguments applied onto the called trigger event listener
    //   ],
    //   cache: true
    // }
    // ```
    route: function (name, def) {
      var self = this;
      var routesExtension = {};
      var controllerExtension = {};
      var currentName = name;

      if (!_.isString(name)) {
        throw new ReferenceError('[Backbone.Highway.route] Route name should be a string');
      }

      // Throw an exception, if def is an empty object nothing will work
      if (!_.isObject(def)) {
        throw new ReferenceError('[Backbone.Highway.route] Route definition needs to be an object');
      }

      // Remove the first slash in the path for the Backbone router
      if (def.path) {
        def.path = this._stripHeadingSlash(def.path);
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
          re: _.isString(def.path) ? this._routeToRegExp(def.path) : null,
          wrappers: []
        };

        // Register the route path and controller name
        routesExtension[def.path] = name;

        // Create a wrapping controller method to permit for multiple route/controller bindings
        controllerExtension[name] = function () {
          self._processControllers({name: name, args: arguments});
        };

        // Apply the new routes
        _.extend(routes, routesExtension);

        // Apply the new controllers
        _.extend(controller, controllerExtension);

        if (router !== null && def.path) {
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
            self._storeCurrentRoute();

            // Redirect to login
            self._processControllers({name: self.options.routes.login});
          }
          else {
            self.options.log('[Backbone.Highway] Skipping route "' + currentName +
              '", ' + (self.options.authenticated ? 'already ' : 'not ') + 'logged in');

            // Execute 403 controller
            //
            // @todo Apply better/finer logic for when the 403 controller should be executed
            this._httpError(403);
          }
          return false;
        }

        // Check if the route is an alias
        // - FIXME:0 Aliasing through the action parameter will probably conflict with before/after triggers
        if (_.isString(def.action)) {
          self.options.log('[Backbone.Highway] Caught alias route: "' + currentName + '" >> "' + def.action + '"');

          // Execute alias route
          self._processControllers({name: def.action, args: args}, true);

          return false;
        }
        else {
          self.options.log('[Backbone.Highway] Executing route named "' + currentName + '"');
        }

        // Process pre-triggers
        if (!_.isEmpty(def.before)) {
          self._processTriggers(def.before, args);
        }

        // Execute route main action
        if (_.isFunction(def.action)) {
          def.action.apply(self, args);
        }

        // Process post-triggers
        if (!_.isEmpty(def.after)) {
          self._processTriggers(def.after, args);
        }

        return true;
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

      return true;
    },

    // --------------------------------

    // **Route the application to a specific named route**
    // - @param  {Mixed} **name** - Route name
    // - @param  {Array} **args** - List of arguments to pass along
    // - @return {Boolean} Will return false if the routing was cancelled, else true
    go: function (name, args, options) {
      var route = null;
      var path = null;

      // Check if an object is given instead of a string
      if (_.isObject(name)) {
        // Rename object
        route = name;

        // Transfer route name
        name = route.name;

        // Transfer route path and remove first slash
        if (_.isString(route.path)) {
          path = this._stripHeadingSlash(route.path);
        }

        // Transfer args
        args = route.args || args;
      }

      // Check if necessary arguments are passed
      if (!name && path === null) {
        this.options.log('[Backbone.Highway.go] Missing parameters, name or path is necessary');
        return false;
      }

      // Check if route exists
      if (
        (name && !this._exists({name: name})) ||
        (path && !this._exists({path: path}))
      ) {
        this.options.log('[Backbone.Highway] Inexisting route name: ' + name);

        // Execute 404 controller
        this._httpError(404);

        return false;
      }

      // Convert object args to array
      if (!_.isUndefined(args) && !_.isArray(args)) {
        var paramNames = this._path(name).match(re.namedParams);
        args = _.map(paramNames, function (name) {
          return args[name.substr(1)];
        });
      }

      var continueProcess = true;

      _.forEach(this.currentRoutes, _.bind(function (route) {
        // Check if the previous route has a close controller
        if (_.isFunction(closeControllers[route]) && name !== route) {
          // Execute close controller passing current route data and retrieve result
          continueProcess = closeControllers[route].call(this, name, args, options);
        }
      }, this));

      // If controller returned false, cancel go process
      if (!continueProcess) {
        return false;
      }

      // Re-initialize currentRoutes storage
      this.currentRoutes = [];

      // Extend default router navigate options
      options = _.extend({trigger: true, replace: false}, options);

      if (!path) {
        // Retrieve route path passing arguments
        path = this._path(name);
        path = path && this._parse(path, args);
      }

      if (path !== false) {
        // Navigate the Backbone.Router
        router.navigate(path, options);
      }

      return true;
    },

    // --------------------------------

    // **Clear all cached triggers**
    clearCache: function () {
      cachedTriggers = [];
      return true;
    },

    // --------------------------------

    // **Process a list of triggers that can be declared as a simple string or an object**
    // - @param {Array} **triggers** The list of triggers to process*
    _processTriggers: function (triggers, routeArgs) {
      var self = this;

      if (!_.isArray(triggers)) {
        triggers = [triggers];
      }

      _.forEach(triggers, function (trigger) {
        self._processTrigger(trigger, routeArgs);
      });
    },

    // --------------------------------

    // **Process a single trigger**
    // - @param {Mixed} **trigger** String or Object describing the trigger*
    _processTrigger: function (trigger, routeArgs) {
      if (_.isObject(trigger)) {
        // Retrieve the name of the trigger if it's declared using a path
        if (trigger.path) {
          trigger.name = this._name(trigger.path);
        }

        // Check if the trigger is marked for caching
        if (trigger.cache && this._cacheTrigger(trigger)) {
          return;
        }

        // Wrap the given parameter in an array
        if (!_.isUndefined(trigger.args) && !_.isNull(trigger.args) && !_.isArray(trigger.args)) {
          trigger.args = [trigger.args];
        }

        // If no arguments were passed to the trigger pass along route arguments
        if (_.isEmpty(trigger.args)) {
          trigger.args = routeArgs;
        }

        // If the trigger is actually a controller execute it
        if (trigger.name && this._exists({name: trigger.name})) {
          this._processControllers(trigger, true);
          return;
        }

        // Create a dispatcher format object
        var args = [trigger.name];

        // Finish formatting trigger arguments for the dispatcher
        _.forEach(trigger.args, function (arg) {
          args.push(arg);
        });

        // Dispatch the event applying arguments
        if (this.hasDispatcher()) {
          this.dispatcher.trigger.apply(this.dispatcher, args);
        }
      }
      else if (_.isString(trigger)) {
        // Check if the trigger is actually a declared route
        if (this._exists({name: trigger})) {
          this._processControllers({
            name: trigger,
            args: routeArgs
          }, true);
        }
        else {
          // Else give to the dispatcher
          if (this.hasDispatcher()) {
            this.dispatcher.trigger.call(this.dispatcher, trigger);
          }
        }
      }
      else {
        this.options.log('[Backbone.Highway._processTrigger] Bad trigger format, ' +
          'needs to be a string or an object, given: ' + typeof trigger);
      }
    },

    // --------------------------------

    // **Process a list of controllers**
    // - @param {Object} **def** The controller definition containing either the route name or its path and
    //   eventually arguments to be passed to the controller*
    // - @param {Boolean} **isTrigger** Is the controller being executed as a trigger i.e. as an alias
    _processControllers: function (def, isTrigger) {
      var self = this;
      var name = def.name;
      var args = def.args;

      // Do not interpret control as a trigger by default
      isTrigger = isTrigger || false;

      // Check if the given controller actually exists
      if (extendedController[name]) {
        // Extract parameters from path if possible
        if (def.path) {
          args = this._extractParameters(name, def.path);

          // Backbone gives [null] for routes without arguments
          // so if there is not more than one argument use the passed arguments instead
          if (args.length === 1 && args[0] === null) {
            args = def.args;
          }
        }

        // Ensure args is properly declared and remove unwanted values
        args = this._sanitizeArgs(args);

        // Loop through each defined route controller
        _.forEach(extendedController[name].wrappers, function (callback) {
          // Execute controller wrapper
          callback.call(self, args, isTrigger);
        });

        return true;
      }

      this.options.log('[Backbone.Highway._processControllers] Inexisting controller: ' + name);
      return false;
    },

    // --------------------------------

    // **Find a cached trigger**
    // - *@param  {Object} **trigger** Trigger object definition*
    // - *@return {Object} Cached trigger object*
    _findCachedTrigger: function (trigger) {
      // Try to check if it already exists
      var cache = _.find(cachedTriggers, function (item) {
        return item.name === trigger.name;
      });

      // If it doesn't, create it and retrieve it again
      if (!cache) {
        cachedTriggers.push(_.extend({}, trigger));
        return this._findCachedTrigger(trigger);
      }

      return cache;
    },

    // --------------------------------

    // **Set a triggers cache state**
    // - *@param  {Object} **trigger** Trigger object definition*
    // - *@return {Boolean} True if already executed, else false*
    _cacheTrigger: function (trigger) {
      // Find cached trigger object
      var cache = this._findCachedTrigger(trigger);

      // Has it already been executed ?
      if (cache.done) {
        this.options.log('[Backbone.Highway] Trigger [ ' +
          (trigger.name || trigger.path) + ' ] has been skipped (cached)');
        return true;
      }

      // Mark it done
      cache.done = true;

      return false;
    },

    // --------------------------------

    // **Start Backbone.History if it hasn't been done yet.**
    // Will trigger a client-side 404 if the loading route doesn't exist
    _startHistory: function () {
      // Check if Backbone.History is already enabled
      if (!Backbone.History.started) {
        this.options.log('[Backbone.Highway.start] Starting Backbone.history (' +
          (this.options.root ? 'root: ' + this.options.root : 'empty root url') + ')');

        // Initialize Backbone.history
        var existingRoute = Backbone.history.start({
          pushState: this.options.pushState,
          root: this.options.root,
          hashChange: this.options.hashChange,
          silent: this.options.silent
        });

        // Trigger a 404 if the current route doesn't exist.
        // Ensure the 'silent' options isn't activated
        if (!existingRoute && !this.options.silent) {
          this._httpError(404);
        }
        else {
          this._applyStoredRoute();
        }
      }
    },

    // **Determine if a dispatcher (event aggregator) was passed with the options when the router was started.**
    _hasDispatcher: function () {
      return this.dispatcher && _.isFunction(this.dispatcher.trigger);
    },

    // --------------------------------

    // **Trigger an error controller**
    // - *@param  {Int} **code** Error code to trigger (404|403)*
    _httpError: function (code) {
      var url = Backbone.history.getFragment();
      this.options.log('[Backbone.Highway] Inexisting route: ' + url);

      if (code !== 404 && code !== 403) {
        throw new Error('[Backbone.Highway] Unhandled http error code: ' + code);
      }

      return this._processControllers({
        name: this.options.routes['error' + code],
        args: [url]
      });
    },

    // --------------------------------

    // **Reload the route that was stored before redirecting to login controller**
    _applyStoredRoute: function () {
      // Check if a route was stored while requiring a user login
      var storedRoute = this._getStoredRoute();

      // If a route is stored, use it!
      if (storedRoute) {
        this.options.log('[Backbone.Highway] Loaded stored route: ' + storedRoute);

        // Clear stored route
        this._clearStore();

        // Redirect to stored route
        this.go({
          path: storedRoute
        });
      }
    },

    // --------------------------------

    // **Retrieve the path of a route by it's name.**
    // - *@param  {String} **routeName**  The route name*
    // - *@return {String} The raw route path or false if the route doesn't exist*
    _path: function (name) {
      var path;

      for (path in routes) {
        if (routes[path] === name) {
          return path;
        }
      }

      return false;
    },

    // --------------------------------

    // **Retrieve the name of a route by it's path**
    // - *@param {String} **path**  The route path*
    // - *@return {Mixed} The name of the route, false if it doesn't exist*
    _name: function (path) {
      var name;

      // Remove first slash
      path = this._stripHeadingSlash(path);

      // Loop through all the controllers
      for (name in extendedController) {
        // Check if given path validates against controller regular expression
        if (extendedController[name].re && extendedController[name].re.test(path)) {
          return name;
        }
      }

      return false;
    },

    // --------------------------------

    // **Check if a route exists by its name or its path**
    // - *@param  {Object}  **params** Object with a name or path key*
    // - *@return {Boolean} True if route exists else false.
    //   Will also return false when wrong type of parameter is passed*
    _exists: function (params) {
      return _.isObject(params) && (
        !_.isUndefined(extendedController[params.name]) || this._name(params.path) !== false
      );
    },

    // --------------------------------

    // **Parse a path to inject a list of arguments into the path.**
    // - *@param  {String} **path** The path to parse containing argument declarations starting with colons*
    // - *@param  {Array}  **args** List of arguments to inject into the path*
    // - *@return {String}      The path with the arguments injected*
    _parse: function (path, args) {
      // Check if any arguments were passed to the parser
      if (!this._isValidArgsArray(args)) {
        // Remove optional parameters from the path
        path = path.replace(re.optionalParams, '');

        // Validate path
        this._checkPath(path);

        return path;
      }

      var self = this;

      // Replace named/splat parameters with actual arguments
      _.forEach(this._sanitizeArgs(args), function (arg) {
        path = self._replaceArg(path, arg);
      });

      // Remove remaining optional components from the path
      _.forEach(path.match(re.optionalParams), function (part) {
        // Only remove components for which arguments where missing
        if (re.namedParam.test(part) || re.splatParams.test(part)) {
          path = path.replace(part, '');
        }
      });

      // Remove remaining parentheses and trailing slashes
      path = path.replace(re.parentheses, '').replace(re.trailingSlash, '');

      // Validate path
      this._checkPath(path);

      return path;
    },

    // --------------------------------

    // **Replace a named argument or a splat parameter in a path**
    _replaceArg: function (path, arg) {
      return path.indexOf(':') !== -1 ? path.replace(re.namedParam, arg) : path.replace(re.splatParams, arg);
    },

    // --------------------------------

    // **Validate parsed path**
    _checkPath: function (path) {
      // Throw an error if mandatory parameters are missing
      if (re.namedParam.test(path) || re.splatParams.test(path)) {
        throw new ReferenceError('[Backbone.Highway._parse] Missing necessary arguments for path');
      }
      return true;
    },

    // --------------------------------

    // **Clean arguments array**
    _sanitizeArgs: function (args) {
      // Ensure args is an array or an arguments object
      if (!_.isObject(args) && !_.isArray(args)) {
        args = [args];
      }
      return _.without(args, null, undefined);
    },

    // --------------------------------

    // **Check if parameter is a valid arguments array sanitizing it before hand**
    _isValidArgsArray: function (args) {
      return !_.isEmpty(this._sanitizeArgs(args));
    },

    // --------------------------------

    // **Store the current pathname in the local storage**
    _storeCurrentRoute: function () {
      // Retrieve current path
      var path = Backbone.history.getFragment();

      this.options.log('[Backbone.Highway] Storing current path: ' + path);

      // Store the path for next init after page reload
      if (localStorage) {
        localStorage.setItem(this._getStoreKey('path'), path);
        return true;
      }
      return false;
    },

    // --------------------------------

    // **Generate a complete store key using the prefix in the options**
    _getStoreKey: function (key) {
      // Concatenate prefix, separator and key
      return this.options.store.prefix + this.options.store.separator + key;
    },

    // --------------------------------

    // **Retrieve the stored route if any**
    // - *@return {String} The currenlty stored route as a string,
    //   null if not existing, false if localStorage doesn't exist*
    _getStoredRoute: function () {
      return localStorage && localStorage.getItem(this._getStoreKey('path'));
    },

    // --------------------------------

    // **Clear the stored route**
    _clearStore: function () {
      if (localStorage) {
        localStorage.removeItem(this._getStoreKey('path'));
        return true;
      }
      return false;
    },

    // --------------------------------

    // **Remove heading slash or pound sign from a path, if any**
    _stripHeadingSlash: function (path) {
      return _.isString(path) && path.replace(re.headingSlash, '');
    },

    // --------------------------------

    // **Extract parameters from the path of a route**
    _extractParameters: function (name, path) {
      return Backbone.Router.prototype._extractParameters(
        extendedController[name].re,
        this._stripHeadingSlash(path)
      );
    },

    // --------------------------------

    // **Transform a route path to a regular expression**
    _routeToRegExp: function (path) {
      return Backbone.Router.prototype._routeToRegExp(path);
    },

    // --------------------------------

    // **Original Backbone.Router Methods**

    // Listen to original Backbone.Router events
    on: function () {
      return router && router.on.apply(router, arguments);
    },

    // Stop listening to original Backbone.Router events
    off: function () {
      return router && router.off.apply(router, arguments);
    },

    // Trigger event on original Backbone.Router
    trigger: function () {
      return router && router.trigger.apply(router, arguments);
    }
  };

  // --------------------------------

  // Initialize Backbone.Highway controller instance
  Backbone.Highway = new Highway();

  // Return instance for AMD/Require environments
  return Backbone.Highway;
}));
