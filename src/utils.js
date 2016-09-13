import _ from 'underscore'

// Path parsing regular expressions
const re = {
  headingSlash: /^(\/|#)/
}

const utils = {
  removeHeadingSlash (path) {
    return _.isString(path) && path.replace(re.headingSlash, '')
  },

  removeRootUrl (path, rootUrl) {
    return _.isString(path) && path.replace(rootUrl, '')
  }
}

export default utils
