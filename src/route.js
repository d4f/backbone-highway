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
  // TODO Verify definition, throw errors if it's not compliant

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

  parse ({ params, query }) {
    return urlComposer.build({ path: this.get('path'), params, query })
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
    return async function actionWrapper (...args) {
      // Convert args to object
      const params = urlComposer.params(path, args)
      const query = parseQuery()

      // Trigger `before` events/middlewares
      if (before) {
        try {
          await trigger.exec({ name, events: before, params, query })
        } catch (err) {
          throw new Error(`[backbone-highway] Route "${name}" was rejected by a "before" middleware`)
        }
      }

      // Execute route action and get result
      let result
      try {
        // Wrap action method in a `Promise.resolve()` in case action is not `async`
        result = await Promise.resolve(
          action({ params, query })
        )
      } catch (err) {
        throw new Error(`[backbone-highway] Route "${name}" was rejected by "action"`)
      }

      // Trigger `before` events/middlewares
      if (after) {
        try {
          await trigger.exec({ name, events: after, params, query, result })
        } catch (err) {
          throw new Error(`[backbone-higway] Route "${name}" was rejected by an "after" middleware`)
        }
      }

      return true
    }
  },

  getNavigateOptions (options) {
    return _.extend({}, defaultNavigateOptions, _.pick(options, ['trigger', 'replace']))
  }
}

// Parse query params from `window.location.search` and return an object
// TODO move to `url-composer` or maybe use `query-string`
function parseQuery () {
  const result = {}
  let query = window.location.search || ''

  query = query.replace(/^.*?\?/, '')

  const pairs = query.split('&')

  _.forEach(pairs, pair => {
    const [key, value] = pair.split('=')

    result[key] = value
  })

  return result
}

export default Route
