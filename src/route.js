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
    let { name, path } = this.definition

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

  execute (...args) {
    this.get('action')(...args)
  },

  getActionWrapper () {
    const { name, action, events } = this.definition

    // Wrap the route action
    return function actionWrapper (...args) {
      if (events) trigger.send(name, events, args)
      action(...args)
    }
  },

  getNavigateOptions (options) {
    return _.extend({}, defaultNavigateOptions, _.pick(options, ['trigger', 'replace']))
  }
}

export default Route
