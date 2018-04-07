import _ from 'underscore'
import Backbone from 'backbone'
import BackboneRouter from './backbone-router'
import Route from './route'
import store from './store'

const defaultOptions = {
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
const error404 = () => {
  // Retrieve the 404 controller
  const error = store.find({ name: '404' })

  // Check if it was actually defined
  if (error) {
    // Execute a 404 controller
    error.execute()
  }
}

// #### Highway public API definition
const highway = {
  // **Initialize the Backbone.Highway router**
  // - *@param {Object} **options** - Object to override default router configuration*
  start (options) {
    // Extend default options
    options = _.extend({}, defaultOptions, options)

    // Store options in global store
    store.set('options', options)

    // Instantiate Backbone.Router
    this.router = BackboneRouter.create()

    // Start Backbone.history
    const existingRoute = BackboneRouter.start(options)

    // Check if the first load route exists, if not and
    // the router is not started silently try to execute 404 controller
    if (!existingRoute && !options.silent) error404()
  },

  // **Register a route to the Backbone.Highway router**
  // - *@param {Object} **definition** - The route definition*
  route (definition) {
    // Create a new route using the given definition
    const route = new Route(definition)

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

    return route
  },

  // **Remove a registered route from the router**
  // - *@param {Object} **search** - Object containing the route `name` or a `path` which will be matched against defined routes*
  remove (definition) {
    // Remove route from store
    const route = store.remove(definition)

    if (!route) return

    // Unregister route from Backbone.Router
    delete this.router.routes[route.get('path')]
    delete this.router[route.get('name')]

    // Create new router instance from modified route definitions
    this.router = BackboneRouter.create()

    return route
  },

  // **Navigate to a declared route using its name or path**
  // - *@param {Mixed} **to** - Route name or Object describing where to navigate*
  go (to) {
    if (!_.isString(to) && !_.isObject(to)) {
      throw new Error(`[ highway.go ] Navigate option needs to be a string or an object, got "${to}"`)
    } else if (_.isObject(to) && !to.name && !to.path) {
      throw new Error('[ highway.go ] Navigate object is missing a "name" or "path" key')
    }

    // Transform route name to navigate object definition
    if (_.isString(to)) {
      to = { name: to }
    }

    // Find the route instance
    const route = store.find(to)

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

    // Retrieve last executed route
    const lastRoute = store.getLastRoute()

    // Force re-executing of the same route
    if (to.force && lastRoute && route.get('name') === lastRoute.get('name')) {
      this.reload()
    }

    // Store the last executed route
    store.setLastRoute(route)

    return true
  },

  // return the current route
  currentRoute () {
    return Backbone.history.getFragment()
  },

  // Reload current route by restarting `Backbone.history`.
  reload: BackboneRouter.restart,

  // Alias for `reload` method.
  restart: BackboneRouter.restart,

  // Export the highway store
  store
}

export default highway
