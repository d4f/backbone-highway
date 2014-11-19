(function(window) {
	"use strict";


	// Import globals
	var Backbone = window.Backbone,
		Marionette = Backbone.Marionette,
		_ = window._;


	/**
	 * Instance holder for the Marionette.AppRouter
	 * @type {Backbone.Marionette.AppRouter}
	 */
	var router = null;

	/**
	 * Basic Backbone.Marionette routes object
	 * @type {Object}
	 */
	var routes = {};

	/**
	 * Basic Backbone.Marionette controller object
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
		 * Tell the router if a user is currently connected or not
		 * Will permit for routes to declare if they should be interpreted when a user is logged in or not
		 */
		"authed": false,


		/**
		 * Initialize the Backbone Marionette router
		 */
		"start": function(app, options) {
			var self = this;

			// Extend default options
			options = _.extend({}, defaultOptions, options);

			// Retrieve the marionette event aggregator if none have been specified
			if (_.isNull(this.dispatcher)) {
				this.dispatcher = app.vent;
			}

			// Retrieve a debug flag
			this.debug = options.debug;

			// Retrieve custom log method
			if (options.log) {
				this.log = options.log;
			}

			this.log("[Backbone.MarionetteRouter.start] Starting router");

			// Extend marionette router
			var Router = Marionette.AppRouter.extend({
				"appRoutes": routes
			});

			// Initialize router
			router = new Router({
				"controller": controller
			});

			// Check if Backbone.History is already enabled
			if (!Backbone.History.started) {
				self.log("[Backbone.MarionetteRouter.start] Starting Backbone.history (" +
					(options.root ? "root: " + options.root : "empty root url") + ")");

				// Init Backbone.history
				Backbone.history.start({
					pushState: options.pushState,
					root: options.root
				});

				// Listen for navigate events
				self.dispatcher.on("navigate", function(route) {
					Backbone.history.navigate(route);
				});
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
				this.log("[Backbone.MarionetteRouter.map] Missing routes definer method as the first param");
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
				// Create a placeholder for the route controllers
				extendedController[name] = [];

				// Register the route path and controller name
				routes_extension[def.path] = name;

				// Create a wrapping controller method to permit for multiple route/controller binding
				controller_extension[name] = function() {
					self.processControllers(name, arguments);
				};

				// Apply the new routes/controllers
				_.extend(routes, routes_extension);
				_.extend(controller, controller_extension);
			}

			// Push the new controller to the given route controllers list
			extendedController[name].push(function() {
				// Check if the route should be ignored based on the user being logged in or not
				// and the route.authed option being set to true or false
				if (!_.isUndefined(def.authed) && ((def.authed && !self.authed) || (!def.authed && self.authed))) {
					self.log("[Backbone.MarionetteRouter] Skipping route '" + currentName +
						"', " + (self.authed ? "" : "not ") + "logged in");
					return false;
				}

				// Check if the route is an alias
				if (_.isString(def.action)) {
					self.log("[Backbone.MarionetteRouter] Caught alias route: '" + currentName + "' >> '" + def.action + "'");
					self.processControllers(def.action, arguments);
					return false;
				} else {
					self.log("[Backbone.MarionetteRouter] Executing route named '" + currentName + "'");
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
			});
		},


		/**
		 * Route the application to a specific named route
		 *
		 * @param  {Mixed} def   String or object defining which route to trigger
		 * @param  {Array} args  List of arguments to pass along
		 */
		"go": function(def, args) {
			var path = "",
				name = "";

			if (_.isString(def)) {
				name = def;
			} else if (_.isObject(def)) {
				name = def.name;
				path = def.path;
			}

			if (!_.isEmpty(name)) {
				path = this.path(name);
			}

			if (_.isArray(args) && !_.isEmpty(args)) {
				path = this.parse(path, args);
			}

			router.navigate(path, {
				trigger: true
			});

			this.dispatcher.trigger("navigate", path);
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
				this.log("[Backbone.MarionetteRouter.processTriggers] Bad triggers format, needs to be a string," +
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
						this.log("[Backbone.MarionetteRouter] Trigger '" + trigger.name + "' has been skipped (cached)");
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
				this.log("[Backbone.MarionetteRouter.processTrigger] Bad trigger format, needs to be a string or an object, given :");
				this.log(trigger);
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
			// Ensure args is an array
			else if (!_.isArray(args)) {
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
		 * @return {String}           The route path
		 */
		"path": function(routeName) {
			var result = false;

			_.forEach(routes, function(route, path) {
				if (route == routeName) {
					result = path;
				}
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
		}

	};


})(window);