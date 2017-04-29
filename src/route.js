import _ from 'underscore'
import trigger from './trigger'
import urlComposer from 'url-composer'

const errorRouteNames = ['404']

const defaultDefinition = {
  name: null,
  path: null,
  action: null
}

const defaultNavigateOptions = {
  trigger: true,
  replace: false
}

function Route (definition) {
  // Store route definition
  this.definition = _.extend({}, defaultDefinition, definition)

  this.configure()
}

Route.prototype = {
  get (property) {
    return this.definition[property]
  },

  set (property, value) {
    this.definition[property] = value
  },

  parse (params) {
    return urlComposer.build({ path: this.get('path'), params })
  },

  configure () {
    // Extract relevant parameters from route definition
    let { name, path } = this.definition

    // Check if a path was defined and that the route is not a special error route
    if (path && !_.includes(errorRouteNames, name)) {
      // Remove heading slash from path
      if (_.isString(path)) {
        path = path.replace(/^(\/|#)/, '')
      }

      // Create regex from path
      this.pathRegExp = urlComposer.regex(path)

      // Reset path after modifying it
      this.set('path', path)
    }

    // Override the given action with the wrapped action
    this.set('action', this.getActionWrapper())
  },

  execute (...args) {
    return this.get('action')(...args)
  },

  getActionWrapper () {
    // Extract relevant parameters from route definition
    const { name, path, action, before, after } = this.definition

    // Wrap the route action
    return function actionWrapper (...args) {
      // Convert args to object
      const params = urlComposer.params(path, args)

      // Create promise for async handling of controller execution
      return new Promise((resolve, reject) => {
        // Trigger `before` events/middlewares
        if (before) {
          return trigger.exec({ name, events: before, params })
            .then(
              // Execute original route action passing route params and promise flow controls
              () => Promise.resolve(
                action({ resolve, reject, params })
              ),
              () => reject(
                new Error(`[ backbone-highway ] Route "${name}" was rejected by a "before" middleware`)
              )
            )
        }

        // Just execute action if no `before` events are declared
        return Promise.resolve(
          action({ resolve, reject, params })
        )
      })
      // Wait for promise resolve
      .then(result => {
        // Trigger `after` events/middlewares
        if (after) {
          return trigger.exec({ name, events: after, params })
        }

        return true
      }).catch(err => {
        // TODO What should we do when the action is rejected
        console.error('caught action error', err)
      })
    }
  },

  getNavigateOptions (options) {
    return _.extend({}, defaultNavigateOptions, _.pick(options, ['trigger', 'replace']))
  }
}

export default Route
