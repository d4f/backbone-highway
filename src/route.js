import _ from 'underscore'
import utils from './utils'
import trigger from './trigger'
import urlComposer from 'url-composer'

const errorRouteNames = ['403', '404']

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
    const { name, path } = this.definition

    // Check if a path was defined and that the route is not a special error route
    if (path && !_.includes(errorRouteNames, name)) {
      // Remove heading slash from path
      this.set('path', utils.removeHeadingSlash(this.get('path')))

      // Create regex from path
      this.pathRegExp = urlComposer.regex(this.get('path'))
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
