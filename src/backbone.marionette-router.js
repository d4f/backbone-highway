(function(window) {
	"use strict";


	// Import globals
	var localStorage = window.localStorage,
		Backbone = window.Backbone,
		_ = window._;


	/**
	 * Instance holder for the Backbone.Router
	 * @type {Backbone.Router}
	 */
	var router = null;

	/**
	 * Basic Backbone routes object
	 * @type {Object}
	 */
	var routes = {};

	/**
	 * MarionetteRouter extended routes definitions
	 * @type {Object}
	 */
	var extendedRoutes = {};

	/**
	 * Basic Backbone controller object
	 * @type {Object}
	 */
	var controller = {};

	/**
	 * MarionetteRouter extended controller
	 * @type {Object}
	 */
	var extendedController = {};

	/**
	 * Trigger cache memory
	 * @type {Array}
	 */
	var cachedTriggers = [];


	/**
	 * Default options that are extended when the MarionetteRouter is started
	 * @type {Object}
	 */
	var defaultOptions = {
		// Use html5 pushState
		"pushState": true,

		// The current user status, logged in or not
		"authed": false,

		// Enable automatic execution of a login route when accessing a secured route
		"redirectToLogin": false,

		// Root url
		"root": "",

		// Print out debug information
		"debug": false,

		// Override log method
		"log": function() {
			if (this.debug && window.console && window.console.log) {
				window.console.log.apply(window.console, arguments);
			}
		}
	};



	/**
	 * MarionetteRouter commander
	 * @type {Object}
	 */
	var MarionetteRouter = Backbone.MarionetteRouter = {

		/**
		 * Which event aggregator to use for the triggers listed in each routes
		 * By default it uses the global Marionette event aggregator but can be replaced by
		 * any other Backbone.Events instance for example :
		 *
		 * var myEvents = {}
		 * _.extend(myEvents, Backbone.Events);
		 * Backbone.MarionetteRouter.dispatcher = myEvents;
		 */
		"dispatcher": null,


		/**
		 * Initialize the Backbone Marionette router
		 */
		"start": function(app, options) {
			var self = this;

			// Extend default options
			this.options = _.extend({}, defaultOptions, options);

			// Retrieve the marionette event aggregator if none have been specified
			if (_.isNull(this.dispatcher)) {
				this.dispatcher = app.vent;
			}

			this.options.log("[Backbone.MarionetteRouter.start] Starting router");

			// Extend Backbone.Router
			var Router = Backbone.Router.extend(_.extend({}, controller, { "routes": routes }));

			// Initialize router
			router = new Router();

			// Check if Backbone.History is already enabled
			if (!Backbone.History.started) {
				this.options.log("[Backbone.MarionetteRouter.start] Starting Backbone.history (" +
					(this.options.root ? "root: " + this.options.root : "empty root url") + ")");

				// Init Backbone.history
				var existingRoute = Backbone.history.start({
					pushState: this.options.pushState,
					root: this.options.root
				});

				// Trigger a 404 if the current route doesn't exist
				if (!existingRoute) {
					this.options.log("[Backbone.MarionetteRouter] Inexisting load route");
					this.processControllers("404", [window.location.pathname]);
				} else {
					// Check if a route was stored while requiring a user login
					var storedRoute = this.getStoredRoute();

					if (storedRoute) {
						// Clear stored route
						this.clearStore();
						
						// Redirect to stored route
						// @todo redirect with client-side routing
						window.location.href = storedRoute;
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
		"map": function(routesDefiner) {
			if (!_.isFunction(routesDefiner)) {
				this.options.log("[Backbone.MarionetteRouter.map] Missing routes definer method as the first param");
			} else {
				routesDefiner.call(this);
			}
		},


		/**
		 * Declare a route and its actions to the Router.
		 * A route is composed of a unique name and an object definition of its actions.
		 * The object can be composed in a few different ways, here is an example for a route named 'user_edit' :
		 *
		 * {
		 *   "path": "/user/:id/edit",
		 *   "before": [
		 *     // Triggers to be executed before the action
		 *   ],
		 *   "action": function(userId) {
		 *     // Custom display generation using the given userId
		 *   }
		 *   "after": [
		 *     // Triggers to be executed after the action
		 *   ]
		 * }
		 *
		 * The action can be the name of another route definition to create aliases like so :
		 *
		 * {
		 *   "path": "/",
		 *   "action": "user_login"
		 * }
		 *
		 * A route can be limited to when a user is connected by setting the route.authed option to true.
		 * For this to work the Backbone.MarionetteRouter.authed parameter has to be set to true when the server considers the user logged in.
		 *
		 * {
		 *   "path": "/admin",
		 *   "authed": true,
		 *   "action": function() {
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
		 *   "name": "trigger:name",
		 *   "args": [
		 *     // List of arguments mapped onto the called trigger event listener
		 *   ]
		 * }
		 *
		 * @param  {String} name The name of the route, needs to be unique (i.e. 'user_add')
		 * @param  {Object} def  The route definition object
		 */
		"route": function(name, def) {
			var self = this,
				routes_extension = {},
				controller_extension = {},
				currentName = name;

			if (!_.isObject(def)) {
				def = {};
			}

			// Remove the first slash in the path for the Backbone router
			if (def.path && def.path.charAt(0) == "/") {
				def.path = def.path.substring(1);
			}

			// Check if a controller has already registered this path
			if (routes[def.path]) {
				// If so, retrieve it's name
				name = routes[def.path];
			} else {
				// Create a placeholder for multiple route names
				extendedRoutes[def.path] = [];

				// Create a placeholder for the route controllers
				extendedController[name] = [];

				// Register the route path and controller name if a path is given
				if (_.isString(def.path)) {
					routes_extension[def.path] = name;

					// Apply the new routes
					_.extend(routes, routes_extension);
				}

				// Create a wrapping controller method to permit for multiple route/controller bindings
				controller_extension[name] = function() {
					self.processControllers(name, arguments);
				};

				// Apply the new controllers
				_.extend(controller, controller_extension);
			}

			var controllerWrapper = function() {
				// Check if the route should be ignored based on the user being logged in or not
				// and the route.authed option being set to true or false
				if (!_.isUndefined(def.authed) && ((def.authed && !self.options.authed) || (!def.authed && self.options.authed))) {
					// Redirect user to login route if defined, else just skip execution
					if (self.options.redirectToLogin) {
						self.options.log("[Backbone.MarionetteRouter] Secured page, redirecting to login");

						self.storeCurrentRoute();

						// Redirect to login
						self.processControllers("login");
					} else {
						self.options.log("[Backbone.MarionetteRouter] Skipping route '" + currentName +
							"', " + (self.options.authed ? "" : "not ") + "logged in");
					}
					return false;
				}

				// Check if the route is an alias
				if (_.isString(def.action)) {
					self.options.log("[Backbone.MarionetteRouter] Caught alias route: '" + currentName + "' >> '" + def.action + "'");

					// Execute alias route
					self.processControllers(def.action, arguments);

					return false;
				} else {
					self.options.log("[Backbone.MarionetteRouter] Executing route named '" + currentName + "'");
				}

				// Process pre-triggers
				if (!_.isEmpty(def.before)) {
					self.processTriggers(def.before);
				}

				// Execute route main action
				if (_.isFunction(def.action)) {
					def.action.apply(self, arguments);
				}

				// Process post-triggers
				if (!_.isEmpty(def.after)) {
					self.processTriggers(def.after);
				}
			};

			// Push the new controller name to the route name's list
			extendedRoutes[def.path].push(currentName);

			// Push the new controller to the given route controllers list
			extendedController[name].push(controllerWrapper);

			// Re-push the controller with the current route name in case it overloads an existing path
			// This is to permit the go method to work on controllers defined with a same path
			if (name !== currentName) {
				// Create a placeholder for the route controllers
				extendedController[currentName] = [];

				// Push the new controller to the given route controllers list
				extendedController[currentName].push(controllerWrapper);
			}
		},


		/**
		 * Route the application to a specific named route
		 *
		 * @param  {Mixed} name  Route name
		 * @param  {Array} args  List of arguments to pass along
		 */
		"go": function(name, args, options) {
			if (!extendedController[name]) {
				this.options.log("[Backbone.MarionetteRouter] Inexisting route name: " + name);
				this.processControllers("404", [window.location.pathname]);
			} else {
				// Extend default router navigate options
				options = _.extend({ "trigger": true, "replace": false }, options);

				// Retrieve route path
				var path = this.path(name);

				// Inject route arguments if necessary
				if ((_.isObject(args) || _.isArray(args)) && !_.isEmpty(args)) {
					path = this.parse(path, args);
				}

				if (path !== false) {
					// Navigate the Backbone.Router
					router.navigate(path, options);
				}
			}
		},


		/**
		 * Process a list of triggers that can be declared as a simple string or an object
		 * 
		 * @param  {Array} triggers The list of triggers to process
		 */
		"processTriggers": function(triggers) {
			var self = this;

			if (_.isArray(triggers)) {
				_.forEach(triggers, function(trigger) {
					self.processTrigger(trigger);
				});
			} else if (_.isString(triggers) || _.isObject(triggers)) {
				this.processTrigger(triggers);
			} else {
				this.options.log("[Backbone.MarionetteRouter.processTriggers] Bad triggers format, needs to be a string," +
					" an object, an array of strings or an array of objects");
			}
		},


		/**
		 * Process a single trigger
		 * 
		 * @param  {Mixed} trigger String or Object describing the trigger
		 */
		"processTrigger": function(trigger) {
			if (_.isObject(trigger)) {
				// Create a dispatcher format object
				var args = [trigger.name];

				// Check if the trigger is actually a declared route
				if (extendedController[trigger.name]) {
					this.processControllers(trigger.name, trigger.args);
					return;
				}

				// Check if the trigger is marked for caching
				if (trigger.cache) {
					// Find cached trigger object
					var cache = this.findCachedTrigger(trigger);

					// Has it already been executed ?
					if (cache.done) {
						this.options.log("[Backbone.MarionetteRouter] Trigger '" + trigger.name + "' has been skipped (cached)");
						return;
					}

					// Mark it done
					cache.done = true;
				}

				// Wrap the given parameter in an array
				if (!_.isArray(trigger.args)) {
					trigger.args = [trigger.args];
				}

				// Finish formatting trigger arguments for the dispatcher
				_.forEach(trigger.args, function(arg) {
					args.push(arg);
				});

				// Dispatch the event
				this.dispatcher.trigger.apply(this.dispatcher, args);
			} else if (_.isString(trigger)) {
				// Check if the trigger is actually a declared route
				if (extendedController[trigger]) {
					this.processControllers(trigger);
				} else {
					// Else give to the dispatcher
					this.dispatcher.trigger.call(this.dispatcher, trigger);
				}
			} else {
				this.options.log("[Backbone.MarionetteRouter.processTrigger] Bad trigger format, needs to be a string or an object, given :");
				this.options.log(trigger);
			}
		},


		/**
		 * Process a list of controllers
		 * 
		 * @param  {String} name The name of the route
		 * @param  {Array}  args JavaScript arguments array
		 */
		"processControllers": function(name, args) {
			var self = this;

			// Lets not pass [undefined] as arguments to the controllers
			if (_.isUndefined(args)) {
				args = [];
			}
			// Ensure args is an array if not an arguments object
			else if (!_.isObject && !_.isArray(args)) {
				args = [args];
			}

			_.forEach(extendedController[name], function(callback) {
				callback.apply(self, args);
			});
		},


		/**
		 * Find a cached trigger
		 * 
		 * @param  {Object} trigger Trigger object definition
		 * @return {Object}         Cached trigger object
		 */
		"findCachedTrigger": function(trigger) {
			var cache = _.find(cachedTriggers, function(item) {
				return item.name == trigger.name;
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
		"clearCache": function() {
			cachedTriggers = [];
		},


		/**
		 * Retrieve the path of a route by it's name
		 * 
		 * @param  {String} routeName The route name
		 * @return {String}           The route path or false if not found
		 */
		"path": function(routeName) {
			var result = false;

			// @todo Re-write this in VanillaJS so that we can break the loop when the result has been found
			_.forEach(extendedRoutes, function(currentRoutes, path) {
				_.forEach(currentRoutes, function(route) {
					if (route === routeName && !_.isUndefined(path)) {
						result = path;
					}
				});
			});

			return result;
		},


		/**
		 * Parse a path to inject a list of arguments into the path
		 * 
		 * @param  {String} path The path to parse containing argument declarations starting with colons
		 * @param  {Array}  args List of arguments to inject into the path
		 * @return {String}      The path with the arguments injected
		 */
		"parse": function(path, args) {
			if (!_.isArray(args) || _.isEmpty(args)) {
				return path;
			}

			var parts = path.split("/"),
				argIndex = 0;

			var newParts = _.map(parts, function(part) {
				if (part.charAt(0) == ":") {
					var arg = args[argIndex];
					argIndex++;

					return arg;
				}
				return part;
			});

			return newParts.join("/");
		},


		/**
		 * Store the current pathname in the local storage
		 */
		"storeCurrentRoute": function() {
			var path = window.location.pathname;

			this.options.log("[Backbone.MarionetteRouter] Storing current path: " + path);

			// @todo Store the path for next init after page reload
			if (localStorage) {
				localStorage.setItem("marionette-router:path", path);
			}
		},


		/**
		 * Retrieve the stored route if any
		 * 
		 * @return {String} The currenlty stored route as a string, null if not existing, false if localStorage doesn't exist
		 */
		"getStoredRoute": function() {
			return localStorage && localStorage.getItem("marionette-router:path");
		},


		/**
		 * Clear the stored route
		 */
		"clearStore": function() {
			if (localStorage) {
				localStorage.removeItem("marionette-router:path");
			}
		}

	};


})(window);