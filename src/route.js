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
    let path = this.get('path')

    return urlComposer.build({ path, params })
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
    const { name, action, before, after } = this.definition

    // Wrap the route action
    return function actionWrapper (...args) {
      // Create promise for async handling of controller execution
      return new Promise((resolve, reject) => {
        // Trigger bound events through event dispatcher
        // if (events) trigger.send(name, events, args)

        if (before) {
          return trigger.exec({ name, events: before, args })
            .then(
              function onFulfilled () {
                // Execute original route action passing route args and promise flow controls
                return action({ resolve, reject, args })
              },
              function onRejected () {
                return reject()
              }
            )
        }

        return action({ resolve, reject, args })
      })
      // Wait for promise resolve
      .then(result => {
        // TODO What should we do when the action is resolved
        console.info('resolved action', result)

        if (after) {
          return trigger.exec({ name, events: after, args })
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
