import _ from 'underscore'
import Backbone from 'backbone'

// Path parsing regular expressions
const re = {
  headingSlash: /^(\/|#)/,
  trailingSlash: /\/$/,
  parentheses: /[\(\)]/g,
  optionalParams: /\((.*?)\)/g,
  splatParams: /\*\w+/g,
  namedParam: /(\(\?)?:\w+/,
  namedParams: /(\(\?)?:\w+/g
}

const utils = {
  re,

  stripHeadingSlash (path) {
    return _.isString(path) && path.replace(re.headingSlash, '')
  },

  routeToRegExp (path) {
    return Backbone.Router.prototype._routeToRegExp(path)
  },

  isValidArgsArray (args) {
    return !_.isEmpty(utils.sanitizeArgs(args))
  },

  sanitizeArgs (args) {
    if (!_.isObject(args) && !_.isArray(args)) {
      args = [args]
    }
    return _.without(args, null, undefined)
  },

  removeOptionalParams (path) {
    return path.replace(re.optionalParams, '')
  },

  replaceArgs (path, args) {
    _.forEach(utils.sanitizeArgs(args), arg => {
      path = utils.replaceArg(path, arg)
    })

    _.forEach(path.match(re.optionalParams), part => {
      if (utils.isNamedOrSplatParam(part)) {
        path = path.replace(part, '')
      }
    })

    return path
  },

  replaceArg (path, arg) {
    return path.indexOf(':') !== -1 ? path.replace(re.namedParam, arg) : path.replace(re.splatParams, arg)
  },

  isNamedOrSplatParam (param) {
    return re.namedParam.test(param) || re.splatParams.test(param)
  },

  removeTrailingSlash (path) {
    return path.replace(re.trailingSlash, '')
  },

  removeHeadingSlash (path) {
    return _.isString(path) && path.replace(re.headingSlash, '')
  },

  removeParentheses (path) {
    return path.replace(re.parentheses, '')
  },

  removeRootUrl (path, rootUrl) {
    return _.isString(path) && path.replace(rootUrl, '')
  }
}

export default utils
